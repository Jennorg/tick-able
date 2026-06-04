import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SERVICE_ROL_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSuperAdmin() {
  // Get any organization id to avoid trigger failures
  const { data: org } = await supabase.from('organizations').select('id').limit(1).single();
  console.log('Using Org ID for creation:', org?.id);

  const email = 'superadmin@tickable.com';
  const password = 'SuperPassword123!';
  
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: 'Sistema SuperAdmin',
      role: 'superadmin',
      is_superadmin: true,
      organization_id: org?.id
    }
  });

  if (authError) {
    console.error('Error:', authError.message);
    return;
  }

  // Ensure profile is correctly set
  await supabase.from('profiles').update({
    role: 'superadmin',
    organization_id: null // Clear org for true global view if logic allows
  }).eq('id', authUser.user.id);

  console.log('✅ SuperAdmin creado:', email);
}

createSuperAdmin().catch(console.error);
