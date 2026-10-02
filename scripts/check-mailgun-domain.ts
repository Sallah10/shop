import { resolveCname, resolveMx, resolveTxt } from "node:dns/promises";

import { loadProjectEnv } from "./load-env.ts";

loadProjectEnv();

const domain = process.argv[2] ?? process.env.MAILGUN_DOMAIN;

if (!domain) {
  console.error("Usage: npm run mailgun:check -- mg.example.com");
  process.exit(1);
}

const mailgunRecords = [
  { name: "@", type: "MX", expected: "mailgun.org" },
  { name: "@", type: "TXT", expected: "v=spf1 include:mailgun.org" },
  { name: "email", type: "CNAME", expected: "mailgun.org" },
  { name: "k1._domainkey", type: "TXT", expected: "k=rsa" },
  { name: "k2._domainkey", type: "TXT", expected: "k=rsa" },
  { name: "k3._domainkey", type: "TXT", expected: "k=rsa" },
];

function recordName(name: string) {
  return name === "@" ? domain : `${name}.${domain}`;
}

async function resolveValues(hostname: string, type: string): Promise<string[]> {
  if (type === "MX") {
    const records = await resolveMx(hostname);
    return records.map((record) => record.exchange);
  }

  if (type === "CNAME") {
    return [String(await resolveCname(hostname))];
  }

  const chunks = await resolveTxt(hostname);
  const values: string[] = [];

  for (const chunk of chunks) {
    values.push(...chunk);
  }

  return values;
}

async function check(record: (typeof mailgunRecords)[number]) {
  const hostname = recordName(record.name);

  try {
    const values = await resolveValues(hostname, record.type);
    const found = values.some((value) =>
      value.toLowerCase().includes(record.expected.toLowerCase()),
    );

    console.log(`${found ? "OK     " : "MISSING"}  ${record.type.padEnd(5)} ${hostname}`);
  } catch {
    console.log(`MISSING  ${record.type.padEnd(5)} ${hostname}`);
  }
}

console.log(`Checking Mailgun DNS records for ${domain}\n`);

for (const record of mailgunRecords) {
  await check(record);
}

console.log(
  "\nAnything marked MISSING still needs to be added in your DNS provider. Mailgun shows the exact values under Sending -> Sending domains -> DNS records.",
);
