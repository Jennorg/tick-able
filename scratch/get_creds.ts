import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SERVICE_ROL_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getSampleCredentials() {
  console.log('🔍 Buscando usuarios de prueba...\n');
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('email, role, organizations(name)')
    .limit(5);

  if (error) {
    console.error('Error fetching profiles:', error.message);
    return;
  }

  profiles.forEach(p => {
    const orgName = (p as any).organizations?.name || 'N/A';
    console.log(`📧 Email: ${p.email}`);
    console.log(`🔑 Password: Password123!`);
    console.log(`👤 Rol: ${p.role}`);
    console.log(`🏢 Empresa: ${orgName}`);
    console.log('----------------------------');
  });
}

getSampleCredentials().catch(console.error);
