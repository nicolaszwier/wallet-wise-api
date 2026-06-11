type ResetPasswordEmailParams = {
  name: string;
  resetUrl: string;
  subject: string;
  greeting: string;
  body: string;
  buttonLabel: string;
  expiryNote: string;
};

export function buildResetPasswordEmail({
  name,
  resetUrl,
  subject,
  greeting,
  body,
  buttonLabel,
  expiryNote,
}: ResetPasswordEmailParams) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #1a1a1a; font-size: 24px;">${greeting.replace('{{name}}', name)}</h1>
      <p style="color: #4a4a4a; font-size: 16px; line-height: 1.5;">${body.replace('{{name}}', name)}</p>
      <a href="${resetUrl}" style="display: inline-block; margin: 24px 0; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px;">${buttonLabel}</a>
      <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">${expiryNote}</p>
    </div>
  `.trim();

  const text = `${greeting.replace('{{name}}', name)}\n\n${body.replace('{{name}}', name)}\n\n${resetUrl}\n\n${expiryNote}`;

  return { subject, html, text };
}
