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
  await sendStaffInviteEmail({
    to,
    name,
    setupLink,
    roleLabel: 'Provider',
  });
}

export async function sendStaffInviteEmail(params: {
  to: string;
  name: string;
  setupLink: string;
  roleLabel: string;
}): Promise<void> {
  const { to, name, setupLink, roleLabel } = params;
  const subject = "You've been invited to Medoflow";
  const html = `
    <p>Hi ${name},</p>
    <p>You've been invited to join Medoflow as ${roleLabel}.</p>
    <p>Click the link below to set your password and get started:</p>
    <p><a href="${setupLink}">${setupLink}</a></p>
    <p>This link expires in 24 hours.</p>
    <p>If you didn't expect this invite, you can safely ignore this email.</p>
  `;
  const text = `
Hi ${name},

You've been invited to join Medoflow as ${roleLabel}.

Set your password here: ${setupLink}

This link expires in 24 hours.

If you didn't expect this invite, you can safely ignore this email.
  `.trim();

  if (!process.env.SMTP_HOST) {
    const isExplicitDev = process.env.NODE_ENV !== 'production';
    if (!isExplicitDev) {
      throw new Error(
        'SMTP is not configured. Refusing to log invite links outside development.'
      );
    }
    console.log('[Email] SMTP not configured. Would send staff invite:');
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
