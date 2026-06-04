import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SERVICE_ROL_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function promoteToSuperAdmin() {
  const email = 'linux@test.com';
  console.log(`🚀 Promocionando a ${email} a SuperAdmin...`);

  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === email);

  if (!user) {
    console.error('❌ Usuario no encontrado.');
    return;
  }

  // 1. Update Auth Metadata
  const { error: authError } = await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: { 
      role: 'superadmin', 
      is_superadmin: true,
      full_name: 'Linux SuperAdmin'
    }
  });

  if (authError) {
    console.error('Error Auth:', authError.message);
    return;
  }

  // 2. Update Profile Table
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ 
      role: 'superadmin',
      organization_id: null // Superadmin no tiene restricciones
    })
    .eq('id', user.id);

  if (profileError) {
    console.error('Error Profile:', profileError.message);
    return;
  }

  console.log('\n✅ Usuario promocionado con éxito:');
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Password: Password123!`);
  console.log(`👤 Rol: superadmin (Acceso Global)`);
}

promoteToSuperAdmin().catch(console.error);
