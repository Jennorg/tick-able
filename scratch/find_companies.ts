import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SERVICE_ROL_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findCompanies() {
  const { data: companies, error } = await supabase.from('companies').select('*').limit(1);
  if (error) {
    console.log('No companies table found:', error.message);
  } else {
    console.log('Companies table exists! Sample:', companies);
  }
}

findCompanies().catch(console.error);
