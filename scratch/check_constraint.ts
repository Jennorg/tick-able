import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SERVICE_ROL_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkConstraint() {
  const { data, error } = await supabase.rpc('get_constraint_def', { table_name: 'profiles', constraint_name: 'profiles_role_check' });
  if (error) {
    console.log('Error getting constraint:', error.message);
    // fallback to generic query
    const { data: d2, error: e2 } = await supabase.from('profiles').select('role').limit(10);
    console.log('Roles found:', Array.from(new Set(d2?.map(r => r.role))));
  } else {
    console.log('Constraint Def:', data);
  }
}

checkConstraint().catch(console.error);
