import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SERVICE_ROL_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLS() {
  const { data: policies, error } = await supabase.rpc('get_policies'); // Might not exist
  if (error) {
    console.log('Error getting policies:', error.message);
  } else {
    console.log('Policies:', policies);
  }
}

checkRLS().catch(console.error);
