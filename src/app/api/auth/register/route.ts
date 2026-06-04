import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, fullName, companyName, orgSlug, role, isInvite } = body;

    if (!email || !password || !fullName || (!companyName && !isInvite)) {
      return NextResponse.json(
        { error: "Todos los campos son obligatorios" },
        { status: 400 },
      );
    }

    // Use anon client — organizations allow public insert via RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    let finalOrgId: string | null = null;
    const finalRole = isInvite ? (role || "agent") : "admin";

    if (isInvite && orgSlug) {
      // Invited user: look up the existing organization
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", orgSlug)
        .single();

      if (orgError || !org) {
        return NextResponse.json(
          { error: "Invitación inválida o empresa no encontrada." },
          { status: 400 }
        );
      }
      finalOrgId = org.id;
    } else {
      // New admin: CREATE THE ORG FIRST (before signup)
      // This way we can pass the org_id in user metadata and the DB trigger
      // will auto-create the profile with the correct organization_id.
      const slug = companyName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      const uniqueSlug = `${slug}-${Math.floor(Math.random() * 9000 + 1000)}`;

      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert([{ name: companyName, slug: uniqueSlug }])
        .select("id")
        .single();

      if (orgError || !org) {
        console.error("Org creation error:", orgError);
        return NextResponse.json(
          { error: "Error al crear la empresa. Intenta de nuevo." },
          { status: 500 }
        );
      }
      finalOrgId = org.id;
    }

    // Sign up the user with org_id + role in metadata
    // The DB trigger handle_new_user will auto-create the profile row
    // with (id, email, full_name, role, organization_id) from metadata.
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: finalRole,
          organization_id: finalOrgId,
        },
      },
    });

    if (authError) {
      // If signup failed but we just created a new org, clean it up to avoid orphans
      if (!isInvite && finalOrgId) {
        await supabase.from("organizations").delete().eq("id", finalOrgId);
      }
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: err.message || "Ocurrió un error inesperado durante el registro." },
      { status: 500 }
    );
  }
}
