import sgMail from '@sendgrid/mail';

export const sendIndexerAlertEmail = async (lastRun: string) => {
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

  // Parse and validate recipients
  const recipients = process.env.ALERT_EMAIL_RECIPIENTS.split(',')
    .map((email) => email.trim())
    .filter((email) => email.length > 0);

  if (recipients.length === 0) {
    throw new Error('No valid email recipients found');
  }

  try {
    await sgMail.send({
      to: recipients,
      from: process.env.ALERT_EMAIL_SENDER ?? '', // must be verified in SendGrid
      subject: 'POKT Metrics Dashboard - Indexer Health Alert',
      text: `🚨 Indexer hasn't run in over 20 minutes.\nLast run at: ${lastRun}`,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to send indexer alert email:', error);
    throw error;
  }
};
