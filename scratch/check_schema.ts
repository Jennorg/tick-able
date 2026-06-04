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
    name: 'Test Category',
    organization_id: org?.id
  }).select();

  if (error) {
    console.error('Error with organization_id:', error.message);
    
    // Try company_id
    const { data: data2, error: error2 } = await supabase.from('categories').insert({
      name: 'Test Category 2',
      company_id: org?.id
    }).select();
    
    if (error2) {
      console.error('Error with company_id:', error2.message);
    } else {
      console.log('Success with company_id!');
    }
  } else {
    console.log('Success with organization_id!');
  }
}

checkSchema().catch(console.error);
