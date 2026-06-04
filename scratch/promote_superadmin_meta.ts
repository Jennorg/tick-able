import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SERVICE_ROL_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function promoteToSuperAdminMetadata() {
  const email = 'linux@test.com';
  console.log(`🚀 Promocionando a ${email} vía Metadatos (Bypassing DB check)...`);

  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === email);

  if (!user) {
    console.error('❌ Usuario no encontrado.');
    return;
  }

  // Update Auth Metadata ONLY (This is enough for our logic)
  const { error: authError } = await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: { 
      ...user.user_metadata,
      is_superadmin: true,
      role: 'admin' // Keep valid DB role
    }
  });

  if (authError) {
    console.error('Error Auth:', authError.message);
    return;
  }

  console.log('\n✅ Usuario promocionado con éxito vía Auth Metadata:');
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Password: Password123!`);
  console.log(`👤 Rol Real: admin (con privilegios de superadmin vía metadatos)`);
}

promoteToSuperAdminMetadata().catch(console.error);
