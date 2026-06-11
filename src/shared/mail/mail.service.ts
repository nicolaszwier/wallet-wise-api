import { Injectable, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Resend } from 'resend';
import { env } from 'src/shared/config/env';
import { buildWelcomeEmail } from './templates/welcome.template';
import { buildResetPasswordEmail } from './templates/reset-password.template';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;

  constructor(private readonly i18n: I18nService) {
    this.resend = new Resend(env.resendApiKey);
  }

  async sendWelcomeEmail({ to, name, lang }: { to: string; name: string; lang: string }) {
    const { subject, html, text } = buildWelcomeEmail({
      name,
      subject: this.i18n.t('emails.welcome.subject', { lang }),
      greeting: this.i18n.t('emails.welcome.greeting', { lang }),
      body: this.i18n.t('emails.welcome.body', { lang }),
    });

    await this.send({ to, subject, html, text });
  }

  async sendResetPasswordEmail({
    to,
    name,
    token,
    lang,
  }: {
    to: string;
    name: string;
    token: string;
    lang: string;
  }) {
    const resetUrl = `${env.appWebUrl}/reset?token=${token}`;

    const { subject, html, text } = buildResetPasswordEmail({
      name,
      resetUrl,
      subject: this.i18n.t('emails.resetPassword.subject', { lang }),
      greeting: this.i18n.t('emails.resetPassword.greeting', { lang }),
      body: this.i18n.t('emails.resetPassword.body', { lang }),
      buttonLabel: this.i18n.t('emails.resetPassword.buttonLabel', { lang }),
      expiryNote: this.i18n.t('emails.resetPassword.expiryNote', { lang }),
    });

    await this.send({ to, subject, html, text });
  }

  private async send({
    to,
    subject,
    html,
    text,
  }: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }) {
    const { error } = await this.resend.emails.send({
      from: env.mailFrom,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  sendWelcomeEmailSafe(params: { to: string; name: string; lang: string }) {
    this.sendWelcomeEmail(params).catch((err) =>
      this.logger.error(`Failed to send welcome email to ${params.to}`, err),
    );
  }

  sendResetPasswordEmailSafe(params: { to: string; name: string; token: string; lang: string }) {
    this.sendResetPasswordEmail(params).catch((err) =>
      this.logger.error(`Failed to send reset password email to ${params.to}`, err),
    );
  }
}
