import "server-only";

type OrderEmailItem = {
  name: string;
  quantity: number;
  unitPrice: number;
};

export type OrderEmailData = {
  orderId: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  total: number;
  items: OrderEmailItem[];
};

function getMailgunConfig() {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const from = process.env.MAILGUN_FROM;

  if (!apiKey || !domain || !from) {
    throw new Error(
      "Mailgun is not configured. Set MAILGUN_API_KEY, MAILGUN_DOMAIN and MAILGUN_FROM in .env.local.",
    );
  }

  return { apiKey, domain, from };
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const { apiKey, domain, from } = getMailgunConfig();

  const body = new URLSearchParams({ from, to, subject, html });

  if (text) {
    body.set("text", text);
  }

  const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Mailgun returned ${response.status}: ${detail}`);
  }

  return (await response.json()) as { id: string; message: string };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildText(order: OrderEmailData): string {
  const lines = order.items.map(
    (item) =>
      `${item.quantity} x ${item.name} (${formatMoney(item.unitPrice)} each) = ${formatMoney(item.unitPrice * item.quantity)}`,
  );

  return [
    `Hi ${order.customerName},`,
    "",
    "Thanks for your order. Here is a summary:",
    "",
    ...lines,
    "",
    `Total: ${formatMoney(order.total)}`,
    `Order ID: ${order.orderId}`,
    "",
    `Shipping to: ${order.shippingAddress}`,
  ].join("\n");
}

function buildHtml(order: OrderEmailData): string {
  const itemRows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e4e4e7;font-size:14px;color:#18181b;">
            ${escapeHtml(item.name)}
            <br />
            <span style="color:#71717a;font-size:13px;">
              ${item.quantity} x ${formatMoney(item.unitPrice)}
            </span>
          </td>
          <td align="right" style="padding:12px 0;border-bottom:1px solid #e4e4e7;font-size:14px;color:#18181b;white-space:nowrap;">
            ${formatMoney(item.unitPrice * item.quantity)}
          </td>
        </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;">
      <tr>
        <td style="padding:24px;border-bottom:1px solid #e4e4e7;">
          <p style="margin:0;font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:0.08em;">Order confirmed</p>
          <h1 style="margin:8px 0 0;font-size:20px;line-height:1.3;">Thanks for your order, ${escapeHtml(order.customerName)}</h1>
          <p style="margin:8px 0 0;font-size:14px;color:#52525b;">We have your order and will send a tracking update once it ships.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${itemRows}
            <tr>
              <td style="padding:16px 0 0;font-size:15px;font-weight:600;">Total</td>
              <td align="right" style="padding:16px 0 0;font-size:15px;font-weight:600;white-space:nowrap;">${formatMoney(order.total)}</td>
            </tr>
          </table>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;background:#fafafa;border-radius:8px;">
            <tr>
              <td style="padding:16px;font-size:13px;color:#52525b;line-height:1.6;">
                <strong style="color:#18181b;">Order ID</strong><br />${escapeHtml(order.orderId)}
                <br /><br />
                <strong style="color:#18181b;">Shipping to</strong><br />${escapeHtml(order.shippingAddress).replaceAll("\n", "<br />")}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:0 24px 24px;font-size:12px;color:#a1a1aa;">
          Northbound, a small shop for well made everyday things.
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendOrderConfirmationEmail(order: OrderEmailData) {
  await sendEmail({
    to: order.customerEmail,
    subject: `Your Northbound order ${order.orderId.slice(0, 8)} is confirmed`,
    html: buildHtml(order),
    text: buildText(order),
  });
}
