const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SERVICE_ROL_KEY
);

async function run() {
  const { data: orgs } = await supabase.from("organizations").select("id, name, slug");
  console.log("Organizations count:", orgs?.length);
  for (const org of orgs || []) {
    const { count: ticketsCount } = await supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", org.id);

    const { count: commentsCount } = await supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", org.id); // Note: comments might not have organization_id, let's see how many comments are linked to tickets of this org

    const { data: tickets } = await supabase
      .from("tickets")
      .select("id")
      .eq("organization_id", org.id);

    const ticketIds = (tickets || []).map(t => t.id);
    let realCommentsCount = 0;
    if (ticketIds.length > 0) {
      const { count } = await supabase
        .from("comments")
        .select("id", { count: "exact", head: true })
        .in("ticket_id", ticketIds);
      realCommentsCount = count || 0;
    }

    console.log(`Org: ${org.name} (${org.slug}) | Tickets: ${ticketsCount} | Comments: ${realCommentsCount}`);
  }
}

run();
