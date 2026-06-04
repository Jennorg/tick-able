import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.NEXT_PUBLIC_SERVICE_ROL_KEY!;

function daysAgo(d: number) {
  return new Date(Date.now() - d * 24 * 3600 * 1000).toISOString();
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function POST() {
  if (!SERVICE_KEY) {
    return NextResponse.json({ error: "Service role key not configured" }, { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  const report: any = { seeded: [], errors: [], skipped: [] };

  // -----------------------------------------------------------------------
  // 1. Identify target organizations: those without agents OR tickets
  // -----------------------------------------------------------------------
  const { data: allOrgs } = await supabase.from("organizations").select("id, name, slug");
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, email, role, organization_id, company_id");
  const { data: allTickets } = await supabase
    .from("tickets")
    .select("id, organization_id");
  const { data: allCompanies } = await supabase
    .from("companies")
    .select("id, name, slug");

  if (!allOrgs) return NextResponse.json({ error: "Could not load organizations" }, { status: 500 });

  // Build look-up maps
  const agentsByOrg: Record<string, typeof allProfiles> = {};
  const ticketsByOrg: Record<string, number> = {};
  const companyByOrgSlug: Record<string, string> = {};

  for (const p of allProfiles ?? []) {
    if (!p.organization_id) continue;
    if (["agent","admin"].includes(p.role)) {
      if (!agentsByOrg[p.organization_id]) agentsByOrg[p.organization_id] = [];
      agentsByOrg[p.organization_id]!.push(p);
    }
  }
  for (const t of allTickets ?? []) {
    if (!t.organization_id) continue;
    ticketsByOrg[t.organization_id] = (ticketsByOrg[t.organization_id] ?? 0) + 1;
  }
  // Map company by slug for easy look-up
  for (const c of allCompanies ?? []) {
    companyByOrgSlug[c.slug] = c.id;
  }

  // -----------------------------------------------------------------------
  // 2. Find orgs to seed (no agents OR no tickets)
  // -----------------------------------------------------------------------
  const targetOrgs = allOrgs.filter((org) => {
    const hasAgents  = (agentsByOrg[org.id]?.length ?? 0) > 0;
    const hasTickets = (ticketsByOrg[org.id] ?? 0) > 0;
    return !hasAgents || !hasTickets;
  });

  if (targetOrgs.length === 0) {
    return NextResponse.json({ message: "All organizations already have agents and tickets.", report });
  }

  // -----------------------------------------------------------------------
  // 3. Seed each org
  // -----------------------------------------------------------------------
  for (const org of targetOrgs) {
    const orgResult: any = { org: org.name, slug: org.slug, inserted: {}, errors: [] };

    // -- Ensure company exists for this org (matching slug) --
    let companyId: string | null = companyByOrgSlug[org.slug] ?? null;
    if (!companyId) {
      // Create a matching company
      const { data: newCompany, error: compErr } = await supabase
        .from("companies")
        .insert({ name: org.name, slug: org.slug })
        .select("id")
        .single();
      if (compErr) {
        orgResult.errors.push(`company: ${compErr.message}`);
        report.errors.push({ org: org.name, step: "company", error: compErr.message });
        report.seeded.push(orgResult);
        continue;
      }
      companyId = newCompany.id;
      orgResult.inserted.company = { id: companyId, slug: org.slug };
    }

    // -- Get existing agents/users for this org, or reuse existing profiles --
    let orgAgents = (agentsByOrg[org.id] ?? []).filter((p) => p.role === "agent");
    let orgAdmins = (agentsByOrg[org.id] ?? []).filter((p) => p.role === "admin");
    let orgUsers  = (allProfiles ?? []).filter(
      (p) => p.organization_id === org.id && p.role === "user"
    );

    // Update company_id on existing profiles if null
    const existingProfiles = [...orgAgents, ...orgAdmins, ...orgUsers];
    for (const p of existingProfiles) {
      if (!p.company_id && companyId) {
        await supabase
          .from("profiles")
          .update({ company_id: companyId })
          .eq("id", p.id);
      }
    }

    // -- If no agents, use any real agent from another org as "borrowed" reference --
    // -- for created_by/assigned_to (since we can't create auth users) --
    // -- We'll use the existing profiles from orgs that have them --
    const allAgentsGlobal = (allProfiles ?? []).filter((p) => p.role === "agent" && p.id);
    const allUsersGlobal  = (allProfiles ?? []).filter((p) => p.role === "user"  && p.id);
    const allAdminsGlobal = (allProfiles ?? []).filter((p) => p.role === "admin" && p.id);

    // For assigned_to: ONLY use agents belonging to the SAME company (FK constraint)
    // If the org has no own agents yet, leave assigned_to as null
    const sameCompanyAgents = (allProfiles ?? []).filter(
      (p) => p.company_id === companyId && p.role === "agent"
    );
    const agent1Assignable = sameCompanyAgents[0] ?? null;
    const agent2Assignable = sameCompanyAgents[1] ?? sameCompanyAgents[0] ?? null;

    // For created_by: can use any real auth profile (global fallback is fine)
    const agent1 = orgAgents[0] ?? allAgentsGlobal[0] ?? allAdminsGlobal[0];
    const agent2 = orgAgents[1] ?? allAgentsGlobal[1] ?? agent1;
    const user1  = orgUsers[0]  ?? allUsersGlobal[0]  ?? agent1;
    const user2  = orgUsers[1]  ?? allUsersGlobal[1]  ?? user1;
    const user3  = orgUsers[2]  ?? allUsersGlobal[2]  ?? user2;

    if (!agent1 || !user1) {
      orgResult.errors.push("No profiles available (even globally) to use as created_by.");
      report.skipped.push({ org: org.name, reason: "No profiles available" });
      report.seeded.push(orgResult);
      continue;
    }

    // -- Categories --
    const categoryNames = [
      { name: "Hardware",           description: "Problemas con equipos físicos, periféricos y servidores." },
      { name: "Software",           description: "Errores, instalaciones y actualizaciones de aplicaciones." },
      { name: "Red y Conectividad", description: "Fallas de red, VPN, Wi-Fi e infraestructura de red." },
      { name: "Seguridad",          description: "Incidentes de seguridad, accesos no autorizados y vulnerabilidades." },
    ];

    const catIds: Record<string, string> = {};
    for (const cat of categoryNames) {
      // Check if already exists for this org
      const { data: existing } = await supabase
        .from("categories")
        .select("id")
        .eq("organization_id", org.id)
        .eq("name", cat.name)
        .maybeSingle();

      if (existing) {
        catIds[cat.name] = existing.id;
        continue;
      }

      const { data: newCat, error: catErr } = await supabase
        .from("categories")
        .insert({ ...cat, organization_id: org.id, company_id: companyId, created_at: daysAgo(55) })
        .select("id")
        .single();

      if (catErr) {
        orgResult.errors.push(`category ${cat.name}: ${catErr.message}`);
      } else {
        catIds[cat.name] = newCat.id;
      }
    }
    orgResult.inserted.categories = Object.keys(catIds).length;

    const hwId  = catIds["Hardware"]           ?? null;
    const swId  = catIds["Software"]           ?? null;
    const netId = catIds["Red y Conectividad"] ?? null;
    const secId = catIds["Seguridad"]          ?? null;
    const fallbackCat = hwId ?? swId ?? netId ?? secId;

    if (!fallbackCat) {
      orgResult.errors.push("No categories could be created.");
      report.seeded.push(orgResult);
      continue;
    }

    // -- Tickets --
    const ticketDefs = [
      {
        title: "Servidor de producción no responde — caída total del sistema",
        description: "Desde las 14:30 el servidor principal no responde a ninguna solicitud HTTP. Los logs muestran errores OOM (Out of Memory). Se intentó reiniciar el proceso Node.js sin éxito. Todos los clientes reportan el servicio como caído.",
        status: "resolved" as const, priority: "urgent" as const, category_id: netId ?? fallbackCat,
        created_by: user1.id, assigned_to: agent1Assignable?.id ?? null,
        ia_summary: "Caída total del servidor de producción por agotamiento de memoria RAM.",
        ia_classification: "infraestructura",
        ia_suggestions: "Reiniciar el servidor con mayor límite de memoria (`--max-old-space-size=4096`). Revisar fugas de memoria con heapdump. Configurar alertas proactivas de uso de RAM.",
        ia_risk_level: "critical" as const, ia_model: "gemini-2.5-flash", ia_latency_ms: 1420, ia_tokens_used: 892,
        ia_prompt: "Eres un asistente de soporte. Analiza: Título: Servidor de producción no responde. Descripción: Desde las 14:30...",
        ia_raw_json: { summary: "Caída por OOM.", classification: "infraestructura", suggestions: "Reiniciar con más memoria.", riskLevel: "critical" },
        created_at: daysAgo(25), updated_at: daysAgo(24),
      },
      {
        title: "Brecha de seguridad — acceso no autorizado a base de datos",
        description: "El sistema SIEM reportó accesos inusuales desde una IP externa (45.133.xx.xx) a las 03:17 AM. Se extrajeron registros de la tabla de usuarios. Los logs confirman la exfiltración de 2,300 registros.",
        status: "in_progress" as const, priority: "urgent" as const, category_id: secId ?? fallbackCat,
        created_by: user2.id, assigned_to: agent2Assignable?.id ?? null,
        ia_summary: "Acceso no autorizado a base de datos con exfiltración de 2,300 registros.",
        ia_classification: "seguridad",
        ia_suggestions: "Revocar inmediatamente credenciales comprometidas. Bloquear IP en el firewall. Notificar a usuarios afectados según protocolo de incidentes.",
        ia_risk_level: "critical" as const, ia_model: "gemini-2.5-flash", ia_latency_ms: 1830, ia_tokens_used: 1104,
        ia_prompt: "Eres un asistente de soporte. Analiza: Título: Brecha de seguridad. Descripción: SIEM reportó accesos inusuales...",
        ia_raw_json: { summary: "Acceso no autorizado con exfiltración.", classification: "seguridad", suggestions: "Revocar credenciales.", riskLevel: "critical" },
        created_at: daysAgo(10), updated_at: daysAgo(9),
      },
      {
        title: "La aplicación de facturación falla al generar PDFs",
        description: "Al exportar facturas el sistema arroja: 'Error al renderizar: fuente no encontrada'. Ocurre con todas las facturas de mayo. Las de meses anteriores funcionan correctamente.",
        status: "open" as const, priority: "medium" as const, category_id: swId ?? fallbackCat,
        created_by: user1.id, assigned_to: agent1Assignable?.id ?? null,
        ia_summary: "Fallo en generación de PDFs por fuente tipográfica faltante.",
        ia_classification: "software",
        ia_suggestions: "Verificar que las fuentes están instaladas en el servidor. Revisar si una actualización movió los assets. Regenerar caché de fuentes.",
        ia_risk_level: "medium" as const, ia_model: "gemini-2.5-flash", ia_latency_ms: 985, ia_tokens_used: 678,
        ia_prompt: "Eres un asistente de soporte. Analiza: Título: Facturación falla al generar PDFs.",
        ia_raw_json: { summary: "Fallo en PDFs por fuente faltante.", classification: "software", suggestions: "Verificar fuentes.", riskLevel: "medium" },
        created_at: daysAgo(7), updated_at: daysAgo(7),
      },
      {
        title: "Impresoras de red del piso 3 no responden",
        description: "Las 4 impresoras HP LaserJet del piso 3 no responden desde esta mañana. El ping falla. Están encendidas según el panel. Los demás dispositivos del switch sí tienen conectividad.",
        status: "resolved" as const, priority: "high" as const, category_id: hwId ?? fallbackCat,
        created_by: user3.id, assigned_to: agent1Assignable?.id ?? null,
        ia_summary: "Desconexión de 4 impresoras HP por fallo en el switch de acceso del piso 3.",
        ia_classification: "hardware",
        ia_suggestions: "Reiniciar el switch del piso 3. Verificar VLAN mal configurada. Actualizar firmware del switch.",
        ia_risk_level: "high" as const, ia_model: "gemini-2.5-flash", ia_latency_ms: 762, ia_tokens_used: 534,
        ia_prompt: "Eres un asistente de soporte. Analiza: Título: Impresoras de red no responden.",
        ia_raw_json: { summary: "Desconexión por fallo en switch.", classification: "hardware", suggestions: "Reiniciar switch.", riskLevel: "high" },
        created_at: daysAgo(20), updated_at: daysAgo(19),
      },
      {
        title: "Solicitud de instalación de Microsoft Teams en laptops de ventas",
        description: "El equipo de ventas (8 personas) necesita Teams antes del lunes para reuniones con el cliente corporativo. Ninguno tiene la aplicación.",
        status: "resolved" as const, priority: "low" as const, category_id: swId ?? fallbackCat,
        created_by: user2.id, assigned_to: agent2Assignable?.id ?? null,
        ia_summary: "Instalación masiva de Microsoft Teams en 8 laptops del equipo de ventas.",
        ia_classification: "software",
        ia_suggestions: "Usar GPO o SCCM para instalar Teams silenciosamente en los 8 equipos. Programar en horario no laboral.",
        ia_risk_level: "low" as const, ia_model: "gemini-2.5-flash", ia_latency_ms: 623, ia_tokens_used: 412,
        ia_prompt: "Eres un asistente de soporte. Analiza: Título: Instalación de Microsoft Teams.",
        ia_raw_json: { summary: "Instalación de Teams en 8 laptops.", classification: "software", suggestions: "Usar GPO.", riskLevel: "low" },
        created_at: daysAgo(30), updated_at: daysAgo(29),
      },
      {
        title: "VPN corporativa extremadamente lenta en home office",
        description: "Varios empleados remotos reportan que la VPN va muy lenta desde hace una semana. Descargas que tardan segundos ahora toman minutos. Sin VPN la velocidad es normal.",
        status: "open" as const, priority: "medium" as const, category_id: netId ?? fallbackCat,
        created_by: user3.id, assigned_to: null,
        ia_summary: "Degradación severa del rendimiento de la VPN para usuarios en home office.",
        ia_classification: "red",
        ia_suggestions: "Revisar carga del servidor VPN. Verificar saturación de ancho de banda. Considerar split tunneling para reducir carga.",
        ia_risk_level: "medium" as const, ia_model: "gemini-2.5-flash", ia_latency_ms: 1050, ia_tokens_used: 720,
        ia_prompt: "Eres un asistente de soporte. Analiza: Título: VPN lenta en home office.",
        ia_raw_json: { summary: "VPN lenta para usuarios remotos.", classification: "red", suggestions: "Revisar servidor VPN.", riskLevel: "medium" },
        created_at: daysAgo(5), updated_at: daysAgo(5),
      },
      {
        title: "Base de datos del CRM con latencia de 8-12 segundos",
        description: "Las consultas al CRM que antes demoraban <500ms ahora tardan 8-12 segundos. El problema empezó post-migración masiva del fin de semana. El servidor tiene recursos disponibles.",
        status: "in_progress" as const, priority: "high" as const, category_id: swId ?? fallbackCat,
        created_by: user1.id, assigned_to: agent2Assignable?.id ?? null,
        ia_summary: "Alta latencia en CRM post-migración por índices desactualizados.",
        ia_classification: "base de datos",
        ia_suggestions: "Ejecutar VACUUM y ANALYZE. Revisar EXPLAIN ANALYZE en queries lentas. Reconstruir índices fragmentados.",
        ia_risk_level: "high" as const, ia_model: "gemini-2.5-flash", ia_latency_ms: 1320, ia_tokens_used: 854,
        ia_prompt: "Eres un asistente de soporte. Analiza: Título: CRM con alta latencia post-migración.",
        ia_raw_json: { summary: "Alta latencia por índices desactualizados.", classification: "base de datos", suggestions: "VACUUM y ANALYZE.", riskLevel: "high" },
        created_at: daysAgo(3), updated_at: daysAgo(2),
      },
      {
        title: "Solicitud de segundo monitor para diseñador gráfico",
        description: "El diseñador de marketing solicita un segundo monitor. Trabaja con un display de 24\" y necesita un segundo para previsualización de diseños simultáneamente.",
        status: "open" as const, priority: "low" as const, category_id: hwId ?? fallbackCat,
        created_by: user2.id, assigned_to: null,
        ia_summary: "Solicitud de equipamiento: segundo monitor para diseñador gráfico de marketing.",
        ia_classification: "hardware",
        ia_suggestions: "Verificar inventario de TI. Si no hay stock, cotizar con proveedores. Monitor mínimo: 24\" Full HD.",
        ia_risk_level: "low" as const, ia_model: "gemini-2.5-flash", ia_latency_ms: 540, ia_tokens_used: 380,
        ia_prompt: "Eres un asistente de soporte. Analiza: Título: Solicitud de segundo monitor.",
        ia_raw_json: { summary: "Solicitud de segundo monitor.", classification: "hardware", suggestions: "Verificar inventario.", riskLevel: "low" },
        created_at: daysAgo(1), updated_at: daysAgo(1),
      },
    ];

    const insertedTicketIds: string[] = [];
    const auditRows: any[] = [];

    for (const def of ticketDefs) {
      const { ia_raw_json, ia_prompt, ia_model, ia_latency_ms, ia_tokens_used, ...ticketBase } = def;

      const { data: tData, error: tErr } = await supabase
        .from("tickets")
        .insert({
          ...ticketBase,
          organization_id: org.id,
          company_id:      companyId,
          ia_prompt,
          ia_model,
          ia_latency_ms,
          ia_tokens_used,
          ia_raw_json,
        })
        .select("id")
        .single();

      if (tErr) {
        orgResult.errors.push(`ticket "${def.title.substring(0, 35)}": ${tErr.message}`);
        insertedTicketIds.push(""); // placeholder
      } else {
        insertedTicketIds.push(tData.id);

        auditRows.push({
          ticket_id:      tData.id,
          prompt:         ia_prompt,
          model:          ia_model,
          latency_ms:     ia_latency_ms,
          tokens_used:    ia_tokens_used,
          result:         ia_raw_json,
          organization_id: org.id,
          company_id:     companyId,
          created_at:     def.created_at,
        });
      }
    }
    orgResult.inserted.tickets = insertedTicketIds.filter(Boolean).length;

    // -- IA Audit Log --
    if (auditRows.length > 0) {
      const { error: auditErr } = await supabase.from("ia_audit_log").insert(auditRows);
      if (auditErr) {
        orgResult.errors.push(`ia_audit_log: ${auditErr.message}`);
      } else {
        orgResult.inserted.ia_audit_log = auditRows.length;
      }
    }

    // -- Comments on first 3 tickets (if created) --
    const commentBatches: any[] = [];
    const t0 = insertedTicketIds[0];
    const t1 = insertedTicketIds[1];
    const t2 = insertedTicketIds[2];
    const t6 = insertedTicketIds[6];

    if (t0) {
      commentBatches.push(
        { ticket_id: t0, author_id: user1.id, content: "El servidor sigue sin responder. Hemos probado reiniciar el servicio pero el proceso muere a los 2 minutos.", is_internal: false },
        { ticket_id: t0, author_id: agent1.id, content: "Estamos revisando los logs. Parece un problema de memory leak en el proceso principal.", is_internal: false },
        { ticket_id: t0, author_id: agent1.id, content: "INTERNO: El proceso consumía 98% de RAM. Objeto no liberado en el GC.", is_internal: true },
        { ticket_id: t0, author_id: agent1.id, content: "Servidor reiniciado con `--max-old-space-size=4096`. El servicio está operativo. Monitoreando.", is_internal: false },
        { ticket_id: t0, author_id: user1.id, content: "Confirmado, el servicio está funcionando. ¡Gracias por la solución!", is_internal: false },
      );
    }
    if (t1) {
      commentBatches.push(
        { ticket_id: t1, author_id: user2.id, content: "El SIEM generó la alerta a las 03:17 AM. Adjunto los logs de auditoría.", is_internal: false },
        { ticket_id: t1, author_id: agent1.id, content: "INTERNO: Confirmada exfiltración. IP bloqueada en firewall. Iniciando protocolo de incidentes.", is_internal: true },
        { ticket_id: t1, author_id: agent1.id, content: "Credenciales comprometidas revocadas. Cambios de contraseña forzados. Investigando el vector de entrada.", is_internal: false },
      );
    }
    if (t2) {
      commentBatches.push(
        { ticket_id: t2, author_id: user1.id, content: "¿Hay alguna actualización? Necesitamos las facturas de mayo para el cierre mensual.", is_internal: false },
        { ticket_id: t2, author_id: agent1.id, content: "Identificamos el problema: una actualización movió la carpeta de fuentes. Estamos restaurando.", is_internal: false },
      );
    }
    if (t6) {
      commentBatches.push(
        { ticket_id: t6, author_id: agent1.id, content: "Ejecutamos VACUUM ANALYZE. La latencia bajó de 12s a 4s. Continuamos optimizando índices.", is_internal: false },
        { ticket_id: t6, author_id: user1.id, content: "Hay mejora pero sigue lento. ¿Cuándo estará completamente resuelto?", is_internal: false },
        { ticket_id: t6, author_id: agent1.id, content: "INTERNO: Falta reconstruir índice compuesto en tabla de oportunidades. Lo haremos esta noche.", is_internal: true },
      );
    }

    if (commentBatches.length > 0) {
      const { error: cErr } = await supabase.from("comments").insert(commentBatches);
      if (cErr) orgResult.errors.push(`comments: ${cErr.message}`);
      else orgResult.inserted.comments = commentBatches.length;
    }

    // -- Notifications --
    const notifRows: any[] = [];
    if (t0) notifRows.push({ user_id: user1.id, ticket_id: t0, message: 'Tu ticket "Servidor de producción no responde" ha sido resuelto.', read: true });
    if (t1) notifRows.push({ user_id: user2.id, ticket_id: t1, message: 'Tu ticket de brecha de seguridad fue recibido y está siendo atendido con prioridad máxima.', read: false });
    if (t2) notifRows.push({ user_id: agent1.id, ticket_id: t2, message: 'Se te asignó: "Aplicación de facturación falla al generar PDFs".', read: false });
    if (t6) notifRows.push({ user_id: agent1.id, ticket_id: t6, message: 'Se te asignó: "Base de datos del CRM con latencia de 8-12 segundos".', read: false });

    if (notifRows.length > 0) {
      const { error: nErr } = await supabase.from("notifications").insert(notifRows);
      if (nErr) orgResult.errors.push(`notifications: ${nErr.message}`);
      else orgResult.inserted.notifications = notifRows.length;
    }

    // -- Token usage history (ia_audit_log exists; usage_stats may not) --
    // Try to insert usage_stats; skip gracefully if table doesn't exist
    const usageRows = [
      { date: new Date(Date.now() - 30*86400000).toISOString().split("T")[0], model: "gemini-2.5-flash", tokens_used: 412,  estimated_cost: (412/1000000)*1.25,  requests_count: 1, organization_id: org.id },
      { date: new Date(Date.now() - 25*86400000).toISOString().split("T")[0], model: "gemini-2.5-flash", tokens_used: 892,  estimated_cost: (892/1000000)*1.25,  requests_count: 1, organization_id: org.id },
      { date: new Date(Date.now() - 20*86400000).toISOString().split("T")[0], model: "gemini-2.5-flash", tokens_used: 534,  estimated_cost: (534/1000000)*1.25,  requests_count: 1, organization_id: org.id },
      { date: new Date(Date.now() - 10*86400000).toISOString().split("T")[0], model: "gemini-2.5-flash", tokens_used: 1104, estimated_cost: (1104/1000000)*1.25, requests_count: 1, organization_id: org.id },
      { date: new Date(Date.now() -  7*86400000).toISOString().split("T")[0], model: "gemini-2.5-flash", tokens_used: 678,  estimated_cost: (678/1000000)*1.25,  requests_count: 1, organization_id: org.id },
      { date: new Date(Date.now() -  5*86400000).toISOString().split("T")[0], model: "gemini-2.5-flash", tokens_used: 720,  estimated_cost: (720/1000000)*1.25,  requests_count: 1, organization_id: org.id },
      { date: new Date(Date.now() -  3*86400000).toISOString().split("T")[0], model: "gemini-2.5-flash", tokens_used: 854,  estimated_cost: (854/1000000)*1.25,  requests_count: 1, organization_id: org.id },
      { date: new Date(Date.now() -  1*86400000).toISOString().split("T")[0], model: "gemini-2.5-flash", tokens_used: 380,  estimated_cost: (380/1000000)*1.25,  requests_count: 1, organization_id: org.id },
    ];

    const { error: usageErr } = await supabase
      .from("usage_stats")
      .upsert(usageRows, { onConflict: "date,model" });
    if (usageErr) {
      orgResult.errors.push(`usage_stats (skipped, may not exist): ${usageErr.message}`);
    } else {
      orgResult.inserted.usage_stats = usageRows.length;
    }

    report.seeded.push(orgResult);
  }

  return NextResponse.json({
    success: true,
    orgsProcessed: targetOrgs.length,
    report,
  });
}
