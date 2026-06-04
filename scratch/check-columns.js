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

  const { data: notifications, error: notifErr } = await supabase.from("notifications").select("*").limit(1);
  console.log("Notifications columns:", notifications ? Object.keys(notifications[0] || {}) : "No data", notifErr);

  const { data: usage_stats, error: usageErr } = await supabase.from("usage_stats").select("*").limit(1);
  console.log("usage_stats columns:", usage_stats ? Object.keys(usage_stats[0] || {}) : "No data", usageErr);

  const { data: tickets, error: ticketErr } = await supabase.from("tickets").select("*").limit(1);
  console.log("Tickets columns:", tickets ? Object.keys(tickets[0] || {}) : "No data", ticketErr);
}

run();
