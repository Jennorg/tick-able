import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-service";
import { createClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password, fullName, companyName, orgSlug, role, isInvite } = body;

  if (!email || !password || !fullName || (!companyName && !isInvite)) {
    return NextResponse.json(
      { error: "Todos los campos son obligatorios" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const supabaseService = createServiceClient();

  try {
    let finalOrgId = null;
    let finalRole = isInvite ? (role || "agent") : "admin";

    // 1. If it's an invite, verify organization first to get the ID
    if (isInvite && orgSlug) {
      const { data: org, error: orgError } = await supabaseService
        .from("organizations")
        .select("id")
        .eq("slug", orgSlug)
        .single();
      
      if (orgError || !org) {
        return NextResponse.json({ error: "Invitación inválida o empresa no encontrada." }, { status: 400 });
      }
      finalOrgId = org.id;
    }

    // 2. Sign up the user
    // We pass the organization_id and role in metadata so the DB trigger (handle_new_user)
    // can link them automatically and securely.
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: finalRole,
          organization_id: finalOrgId, // Only present if isInvite
        },
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const user = authData.user;
    if (!user) {
      return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 });
    }

    // 3. If it's a NEW ADMIN (not an invite), create the organization now
    if (!isInvite) {
      const slug = companyName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
      
      const { data: org, error: orgError } = await supabaseService
        .from("organizations")
        .insert([
          { 
            name: companyName, 
            slug: `${slug}-${Math.floor(Math.random() * 1000)}` 
          }
        ])
        .select()
        .single();

      if (orgError) {
        console.error("Org creation error:", orgError);
        return NextResponse.json({ error: "Usuario creado pero falló la creación de la empresa." }, { status: 500 });
      }

      // Link the admin to the newly created org
      const { error: profileError } = await supabaseService
        .from("profiles")
        .update({
          organization_id: org.id,
          role: "admin"
        })
        .eq("id", user.id);

      if (profileError) {
        console.error("Profile link error:", profileError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Registration error:", err);
    return NextResponse.json({ 
      error: "Ocurrió un error inesperado durante el registro."
    }, { status: 500 });
  }
}
