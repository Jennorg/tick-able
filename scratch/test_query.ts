import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SERVICE_ROL_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testQuery() {
  console.log('🔍 Testing profiles query with organizations join...');
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*, organizations(name)')
    .limit(1);

  if (error) {
    console.error('❌ Error with organizations(name):', error.message);
    
    console.log('🔍 Trying with organization_id explicitly...');
    const { data: d2, error: e2 } = await supabase
      .from('profiles')
      .select('*, organizations!organization_id(name)')
      .limit(1);
    
    if (e2) {
      console.error('❌ Error with organizations!organization_id(name):', e2.message);
      
      console.log('🔍 Trying with companies join...');
      const { data: d3, error: e3 } = await supabase
        .from('profiles')
        .select('*, companies(name)')
        .limit(1);
      
      if (e3) {
        console.error('❌ Error with companies(name):', e3.message);
      } else {
        console.log('✅ Success with companies(name)!');
      }
    } else {
      console.log('✅ Success with organizations!organization_id(name)!');
    }
  } else {
    console.log('✅ Success with organizations(name)!');
  }
}

testQuery().catch(console.error);
