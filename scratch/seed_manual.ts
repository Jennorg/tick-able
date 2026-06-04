import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';

// Hardcoded for direct execution since .env.local doesn't have Service Key
const supabaseUrl = 'https://iioyyturncntynmvydff.supabase.co';
// WARNING: YOU NEED THE SERVICE_ROLE_KEY TO BYPASS RLS AND CREATE AUTH USERS
const supabaseServiceKey = 'PASTE_SERVICE_ROLE_KEY_HERE'; 

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seed() {
  console.log('🚀 Starting Seeding...');

  // 1. Create Organizations
  console.log('🏢 Creating Organizations...');
  const orgs = [
    { name: 'TechSolutions Inc', slug: 'tech-solutions' },
    { name: 'Global Retail Corp', slug: 'global-retail' },
    { name: 'HealthPlus Systems', slug: 'health-plus' }
  ];

  const createdOrgs = [];
  for (const org of orgs) {
    const { data, error } = await supabase
      .from('organizations')
      .upsert(org, { onConflict: 'slug' })
      .select()
      .single();
    
    if (error) {
      console.error(`Error creating org ${org.name}:`, error.message);
      continue;
    }
    createdOrgs.push(data);
  }

  // 2. Create Categories for each Org
  console.log('📂 Creating Categories...');
  const categoryNames = ['Soporte Técnico', 'Facturación', 'Ventas', 'Reclamos', 'General'];
  
  for (const org of createdOrgs) {
    const categories = categoryNames.map(name => ({
      name,
      organization_id: org.id,
      description: faker.lorem.sentence()
    }));

    const { error } = await supabase
      .from('categories')
      .insert(categories);
    
    if (error) console.error(`Error creating categories for ${org.name}:`, error.message);
  }

  // 3. Create Sample Users
  console.log('👥 Creating Users (Admins, Agents, Users)...');
  
  for (const org of createdOrgs) {
    const usersToCreate = [
      { role: 'admin', count: 1 },
      { role: 'agent', count: 2 },
      { role: 'user', count: 3 }
    ];

    for (const group of usersToCreate) {
      for (let i = 0; i < group.count; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const fullName = `${firstName} ${lastName}`;
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${faker.number.int(1000)}@example.com`;
        const password = 'Password123!';

        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            role: group.role,
            organization_id: org.id
          }
        });

        if (authError) {
          console.error(`Error creating auth user ${email}:`, authError.message);
          continue;
        }

        await supabase
          .from('profiles')
          .update({
            organization_id: org.id,
            role: group.role,
            full_name: fullName
          })
          .eq('id', authUser.user.id);

        // 4. Create Tickets
        if (group.role === 'user') {
          console.log(`🎫 Creating Tickets for ${fullName} (${org.name})...`);
          
          const { data: categories } = await supabase
            .from('categories')
            .select('id')
            .eq('organization_id', org.id);

          for (let j = 0; j < 3; j++) {
            const ticketTitle = faker.hacker.phrase();
            const { data: ticket, error: ticketError } = await supabase
              .from('tickets')
              .insert({
                title: ticketTitle,
                description: faker.lorem.paragraphs(2),
                priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'urgent']),
                status: faker.helpers.arrayElement(['open', 'in_progress', 'resolved']),
                organization_id: org.id,
                created_by: authUser.user.id,
                category_id: faker.helpers.arrayElement(categories || []).id,
                customer_email: email,
                customer_name: fullName,
                ia_risk_level: faker.helpers.arrayElement(['low', 'medium', 'high', 'critical']),
                ia_summary: faker.lorem.sentence()
              })
              .select()
              .single();

            if (ticketError) continue;

            // 5. Create Comments
            const { data: agents } = await supabase
              .from('profiles')
              .select('id')
              .eq('organization_id', org.id)
              .in('role', ['admin', 'agent']);

            if (agents && agents.length > 0) {
              const commentCount = faker.number.int({ min: 1, max: 3 });
              for (let k = 0; k < commentCount; k++) {
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
  }
  console.log('✅ Seeding completed!');
}

seed().catch(console.error);
