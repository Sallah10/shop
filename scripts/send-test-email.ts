import { sendEmail } from "../lib/mailgun.ts";

const to = process.argv[2] ?? process.env.MAILGUN_TEST_RECIPIENT;

if (!to) {
  console.error("Usage: npm run email:test -- you@example.com");
  process.exit(1);
}

try {
  const result = await sendEmail({
    to,
    subject: "Northbound test email",
    html: "<h1 style=\"font-family:sans-serif\">Mailgun works</h1><p style=\"font-family:sans-serif\">If you can read this, order confirmation emails will arrive.</p>",
    text: "Mailgun works. If you can read this, order confirmation emails will arrive.",
  });

  console.log(`Sent to ${to}. Message id: ${result.id}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
