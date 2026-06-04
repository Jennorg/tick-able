import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SERVICE_ROL_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugUser() {
  const email = 'linux@test.com';
  console.log(`🔍 Debugging user: ${email}`);

  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    console.error('User not found in Auth');
    return;
  }

  console.log('Auth Metadata:', user.user_metadata);

  const { data: profile, error: profError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profError) {
    console.error('Profile Error:', profError.message);
  } else {
    console.log('Profile Data:', profile);
  }
}

debugUser().catch(console.error);
