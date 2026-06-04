require("dotenv").config({ path: ".env.local" });

const confirmationWebhook = process.env.N8N_TICKET_CONFIRMATION_WEBHOOK;
const priorityWebhook = process.env.N8N_HIGH_PRIORITY_WEBHOOK;

console.log("Confirmation Webhook URL:", confirmationWebhook);
console.log("Priority Webhook URL:", priorityWebhook);

async function testWebhook(name, url, body) {
  if (!url) {
    console.log(`[${name}] Skip: URL is not defined`);
    return;
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    console.log(`[${name}] Status:`, res.status);
    const text = await res.text();
    console.log(`[${name}] Response:`, text);
  } catch (err) {
    console.error(`[${name}] Error triggering:`, err.message);
  }
}

async function run() {
  console.log("\n--- Testing Ticket Confirmation Webhook (Test Endpoint) ---");
  await testWebhook("Confirmation (Test)", confirmationWebhook, {
    record: {
      id: "test-ticket-uuid-123",
      title: "Test ticket for n8n verification",
      email: "jenorg.test@example.com",
      priority: "medium"
    }
  });

  const productionConfirmationWebhook = confirmationWebhook?.replace("/webhook-test/", "/webhook/");
  console.log("\n--- Testing Ticket Confirmation Webhook (Production Endpoint) ---");
  await testWebhook("Confirmation (Production)", productionConfirmationWebhook, {
    record: {
      id: "test-ticket-uuid-123",
      title: "Test ticket for n8n verification",
      email: "jenorg.test@example.com",
      priority: "medium"
    }
  });

  console.log("\n--- Testing High Priority Alert Webhook ---");
  await testWebhook("High Priority Alert", priorityWebhook, {
    record: {
      id: "test-ticket-uuid-456",
      title: "URGENTE: Falla catastrófica de red",
      priority: "urgent"
    }
  });
}

run();
