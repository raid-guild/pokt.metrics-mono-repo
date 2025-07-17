import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is not set in environment variables');
}

if (!process.env.ALERT_EMAIL_RECIPIENTS) {
  throw new Error('ALERT_EMAIL_RECIPIENTS is not set in environment variables');
}

if (!process.env.ALERT_EMAIL_SENDER) {
  throw new Error('ALERT_EMAIL_SENDER is not set in environment variables');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export const sendIndexerAlertEmail = async (lastRun: string) => {
  await sgMail.send({
    to: process.env.ALERT_EMAIL_RECIPIENTS?.split(',').map((email) => email.trim()) || [], // comma-separated list in env var
    from: process.env.ALERT_EMAIL_SENDER ?? '', // must be verified in SendGrid
    subject: 'POKT Metrics Dashboard - Indexer Health Alert',
    text: `🚨 Indexer hasn't run in over 20 minutes.\nLast run at: ${lastRun}`,
  });
};
