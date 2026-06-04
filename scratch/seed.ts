import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SERVICE_ROL_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seed() {
  console.log('🚀 Starting Seeding (Robust Multi-Tenant)...');

  // 1. Create Companies & Organizations (Dual-tracking for schema compatibility)
  console.log('🏢 Creating Companies and Organizations...');
  const tenants = [
    { name: 'TechSolutions Inc', slug: 'tech-solutions' },
    { name: 'Global Retail Corp', slug: 'global-retail' },
    { name: 'HealthPlus Systems', slug: 'health-plus' }
  ];

  const createdTenants = [];
  for (const t of tenants) {
    // Create Company
    const { data: company, error: compErr } = await supabase
      .from('companies')
      .upsert({ name: t.name, slug: t.slug }, { onConflict: 'slug' })
      .select()
      .single();
    
    if (compErr) {
      console.error(`Error creating company ${t.name}:`, compErr.message);
      continue;
    }

    // Create Organization
    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .upsert({ name: t.name, slug: t.slug }, { onConflict: 'slug' })
      .select()
      .single();
    
    if (orgErr) {
      console.error(`Error creating org ${t.name}:`, orgErr.message);
      continue;
    }

    createdTenants.push({ companyId: company.id, orgId: org.id, name: t.name });
  }

  // 2. Create Categories
  console.log('📂 Creating Categories...');
  const categoryNames = ['Soporte Técnico', 'Facturación', 'Ventas', 'Reclamos', 'General'];
  
  for (const t of createdTenants) {
    const categories = categoryNames.map(name => ({
      name,
      organization_id: t.orgId,
      company_id: t.companyId,
      description: faker.lorem.sentence()
    }));

    const { error } = await supabase
      .from('categories')
      .insert(categories);
    
    if (error) console.error(`Error creating categories for ${t.name}:`, error.message);
  }

  // 3. Create Sample Users
  console.log('👥 Creating Users (Admins, Agents, Users)...');
  
  for (const t of createdTenants) {
    const roles = [
      { role: 'admin', count: 1 },
      { role: 'agent', count: 2 },
      { role: 'user', count: 3 }
    ];

    for (const group of roles) {
      for (let i = 0; i < group.count; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const fullName = `${firstName} ${lastName}`;
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${faker.number.int(1000)}@example.com`;
        
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email,
          password: 'Password123!',
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            role: group.role,
            organization_id: t.orgId,
            company_id: t.companyId
          }
        });

        if (authError) {
          console.error(`Error creating auth user ${email}:`, authError.message);
          continue;
        }

        await supabase
          .from('profiles')
          .update({
            organization_id: t.orgId,
            company_id: t.companyId,
            role: group.role,
            full_name: fullName
          })
          .eq('id', authUser.user.id);

        // 4. Create Tickets
        if (group.role === 'user') {
          const { data: categories } = await supabase
            .from('categories')
            .select('id')
            .eq('organization_id', t.orgId);

          for (let j = 0; j < 2; j++) {
            const ticketTitle = faker.hacker.phrase();
            const { data: ticket, error: ticketError } = await supabase
              .from('tickets')
              .insert({
                title: ticketTitle,
                description: faker.lorem.paragraphs(2),
                priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'urgent']),
                status: faker.helpers.arrayElement(['open', 'in_progress', 'resolved']),
                organization_id: t.orgId,
                company_id: t.companyId,
                created_by: authUser.user.id,
                category_id: faker.helpers.arrayElement(categories || []).id,
                customer_email: email,
                customer_name: fullName,
                ia_risk_level: faker.helpers.arrayElement(['low', 'medium', 'high', 'critical']),
                ia_summary: faker.lorem.sentence()
              })
              .select()
              .single();

            if (ticketError) {
              console.error(`Error creating ticket for ${email}:`, ticketError.message);
              continue;
            }

            // 5. Comments
            const { data: agents } = await supabase
              .from('profiles')
              .select('id')
              .eq('organization_id', t.orgId)
              .in('role', ['admin', 'agent']);

            if (agents && agents.length > 0) {
              const authorId = faker.helpers.arrayElement([authUser.user.id, ...agents.map(a => a.id)]);
              await supabase.from('comments').insert({
                ticket_id: ticket.id,
                author_id: authorId,
                content: faker.lorem.sentences(1),
                is_internal: faker.datatype.boolean(0.1)
              });
            }
          }
        }
      }
    }
  }

  console.log('✅ Seeding completed successfully!');
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
