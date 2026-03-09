import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth:
    process.env.SMTP_USER && process.env.SMTP_PASS
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
});

const FROM = process.env.SMTP_FROM || 'noreply@medoflow.com';

export async function sendProviderInviteEmail(
  to: string,
  name: string,
  setupLink: string
): Promise<void> {
  const subject = "You've been invited to Medoflow";
  const html = `
    <p>Hi ${name},</p>
    <p>You've been invited to join Medoflow as a provider.</p>
    <p>Click the link below to set your password and get started:</p>
    <p><a href="${setupLink}">${setupLink}</a></p>
    <p>This link expires in 24 hours.</p>
    <p>If you didn't expect this invite, you can safely ignore this email.</p>
  `;
  const text = `
Hi ${name},

You've been invited to join Medoflow as a provider.

Set your password here: ${setupLink}

This link expires in 24 hours.

If you didn't expect this invite, you can safely ignore this email.
  `.trim();

  if (!process.env.SMTP_HOST) {
    console.log('[Email] SMTP not configured. Would send provider invite:');
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Link: ${setupLink}`);
    return;
  }

  await transporter.sendMail({
    from: FROM,
    to,
    subject,
    text,
    html,
  });
}
