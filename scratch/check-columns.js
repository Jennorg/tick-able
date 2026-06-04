const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SERVICE_ROL_KEY
);

async function run() {
  // Query information_schema.columns
  const { data: cols, error } = await supabase
    .from("profiles") // Just query via RPC or direct SQL using pg_class if we can't query information_schema directly
    .select("*")
    .limit(1);

  if (error) {
    console.error("Profiles error:", error);
  } else {
    console.log("Profiles sample:", cols);
  }

  // Let's execute some SQL to inspect columns of comments, notifications, etc.
  // We don't have a direct SQL execution endpoint unless we use RPC or inspect errors.
  // Actually, we can check the columns by trying to insert and seeing what columns are accepted,
  // or by selecting from those tables and checking the keys of the returned rows!
  const { data: comments, error: commErr } = await supabase.from("comments").select("*").limit(1);
  console.log("Comments columns:", comments ? Object.keys(comments[0] || {}) : "No data", commErr);

  const { data: organizations, error: orgErr } = await supabase.from("organizations").select("*").limit(1);
  console.log("Organizations columns:", organizations ? Object.keys(organizations[0] || {}) : "No data", orgErr);

  const { data: companies, error: compErr } = await supabase.from("companies").select("*").limit(1);
  console.log("Companies columns:", companies ? Object.keys(companies[0] || {}) : "No data", compErr);

  const { data: tickets, error: ticketErr } = await supabase.from("tickets").select("*").limit(1);
  console.log("Tickets columns:", tickets ? Object.keys(tickets[0] || {}) : "No data", ticketErr);
}

run();
