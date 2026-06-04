import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SERVICE_ROL_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspect() {
  const { data: orgs } = await supabase.from('organizations').select('*').limit(1);
  console.log('Organizations:', orgs);

  const { data: profiles } = await supabase.from('profiles').select('*').limit(1);
  console.log('Profiles:', profiles);

  const { data: categories } = await supabase.from('categories').select('*').limit(1);
  console.log('Categories:', categories);

  const { data: tickets } = await supabase.from('tickets').select('*').limit(1);
  console.log('Tickets:', tickets);
}

inspect().catch(console.error);
