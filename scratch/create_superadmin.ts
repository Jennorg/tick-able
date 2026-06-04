import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SERVICE_ROL_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createSuperAdmin() {
  console.log('🚀 Creando SuperAdmin global...');
  
  const email = 'superadmin@tickable.com';
  const password = 'SuperPassword123!';
  const fullName = 'Sistema SuperAdmin';

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: 'superadmin',
      is_superadmin: true
    }
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      console.log('ℹ️ El usuario ya existe, actualizando privilegios...');
      // find user id
      const { data: users } = await supabase.auth.admin.listUsers();
      const user = users.users.find(u => u.email === email);
      if (user) {
        await supabase.auth.admin.updateUserById(user.id, {
          user_metadata: { is_superadmin: true, role: 'superadmin' }
        });
        await supabase.from('profiles').update({ role: 'superadmin', full_name: fullName }).eq('id', user.id);
      }
    } else {
      console.error('❌ Error creating superadmin:', authError.message);
      return;
    }
  } else {
    // Create/Update profile
    await supabase
      .from('profiles')
      .update({
        role: 'superadmin',
        full_name: fullName,
        organization_id: null // Superadmin no tiene empresa fija
      })
      .eq('id', authUser.user.id);
  }

  console.log('\n✅ SuperAdmin creado/actualizado con éxito:');
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Password: ${password}`);
  console.log(`👤 Rol: superadmin (Acceso Global)`);
}

createSuperAdmin().catch(console.error);
