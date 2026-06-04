export async function triggerTicketConfirmation(ticket: { id: string; title: string; email: string; priority: string }) {
  const url = process.env.N8N_TICKET_CONFIRMATION_WEBHOOK;
  console.log(`[n8n Webhook] Triggering ticket confirmation for ticket ${ticket.id}. URL: ${url}`);
  if (!url) {
    console.error("N8N_TICKET_CONFIRMATION_WEBHOOK is not defined in environment variables.");
    return false;
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        record: {
          id: ticket.id,
          title: ticket.title,
          email: ticket.email,
          priority: ticket.priority,
        },
      }),
    });
    const text = await res.text();
    console.log(`[n8n Webhook] Confirmation response status: ${res.status}, body: ${text}`);
    if (!res.ok) {
      console.error(`n8n confirmation webhook returned status ${res.status}`);
    }
    return res.ok;
  } catch (error) {
    console.error("Failed to trigger n8n ticket confirmation:", error);
    return false;
  }
}

export async function triggerHighPriorityAlert(ticket: { id: string; title: string; priority: string }) {
  const url = process.env.N8N_HIGH_PRIORITY_WEBHOOK;
  console.log(`[n8n Webhook] Triggering high priority alert for ticket ${ticket.id} (${ticket.priority}). URL: ${url}`);
  if (!url) {
    console.error("N8N_HIGH_PRIORITY_WEBHOOK is not defined in environment variables.");
    return false;
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        record: {
          id: ticket.id,
          title: ticket.title,
          priority: ticket.priority,
        },
      }),
    });
    const text = await res.text();
    console.log(`[n8n Webhook] High priority response status: ${res.status}, body: ${text}`);
    if (!res.ok) {
      console.error(`n8n priority webhook returned status ${res.status}`);
    }
    return res.ok;
  } catch (error) {
    console.error("Failed to trigger n8n high priority alert:", error);
    return false;
  }
}
