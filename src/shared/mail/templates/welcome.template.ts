type WelcomeEmailParams = {
  name: string;
  subject: string;
  greeting: string;
  body: string;
};

export function buildWelcomeEmail({ name, subject, greeting, body }: WelcomeEmailParams) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #1a1a1a; font-size: 24px;">${greeting.replace('{{name}}', name)}</h1>
      <p style="color: #4a4a4a; font-size: 16px; line-height: 1.5;">${body.replace('{{name}}', name)}</p>
    </div>
  `.trim();

  const text = `${greeting.replace('{{name}}', name)}\n\n${body.replace('{{name}}', name)}`;

  return { subject, html, text };
}
