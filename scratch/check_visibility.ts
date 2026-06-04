import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Login as linux@test.com
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkVisibility() {
  const { data: { session }, error: loginErr } = await supabase.auth.signInWithPassword({
    email: 'linux@test.com',
    password: 'Password123!'
  });

  if (loginErr) {
    console.error('Login Error:', loginErr.message);
    return;
  }

  console.log('Logged in! UID:', session?.user.id);
  console.log('Metadata:', session?.user.user_metadata);

  const { data: profiles, error: profErr } = await supabase.from('profiles').select('*');

  if (profErr) {
    console.error('Profiles Error:', profErr.message);
  } else {
    console.log('Profiles visible via RLS:', profiles.length);
  }
}

checkVisibility().catch(console.error);
