import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SERVICE_ROL_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  const { data: org } = await supabase.from('organizations').select('id').limit(1).single();
  console.log('Org ID:', org?.id);

  const { data, error } = await supabase.from('categories').insert({
    name: 'Test Category 3',
    organization_id: org?.id,
    company_id: org?.id
  }).select();

  if (error) {
    console.error('Error with both:', error.message);
  } else {
    console.log('Success with both organization_id and company_id!');
  }
}

checkSchema().catch(console.error);
