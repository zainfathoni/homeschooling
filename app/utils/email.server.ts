const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;

type SendEmailOptions = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
    console.log("[DEV] Email would be sent:", options);
    return { success: true };
  }

  const formData = new FormData();
  formData.append("from", `Homeschool Planner <noreply@${MAILGUN_DOMAIN}>`);
  formData.append("to", options.to);
  formData.append("subject", options.subject);
  formData.append("text", options.text);
  if (options.html) {
    formData.append("html", options.html);
  }

  try {
    const response = await fetch(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${MAILGUN_API_KEY}`).toString("base64")}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Mailgun error:", errorText);
      return { success: false, error: "Failed to send email" };
    }

    return { success: true };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error: "Failed to send email" };
  }
}

export async function sendMagicLinkEmail(email: string, magicLinkUrl: string): Promise<{ success: boolean; error?: string }> {
  const text = `Sign in to Homeschool Planner

Click this link to sign in:
${magicLinkUrl}

This link expires in 15 minutes.

If you didn't request this email, you can safely ignore it.`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px; background: #E8E4F0;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <h1 style="margin: 0 0 24px; font-size: 24px; color: #1f2937;">Sign in to Homeschool Planner</h1>
    <p style="margin: 0 0 24px; color: #4b5563; line-height: 1.6;">Click the button below to sign in to your account:</p>
    <a href="${magicLinkUrl}" style="display: inline-block; background: #F08080; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500;">Sign In</a>
    <p style="margin: 24px 0 0; color: #9ca3af; font-size: 14px;">This link expires in 15 minutes.</p>
    <p style="margin: 16px 0 0; color: #9ca3af; font-size: 14px;">If you didn't request this email, you can safely ignore it.</p>
  </div>
</body>
</html>`;

  return sendEmail({
    to: email,
    subject: "Sign in to Homeschool Planner",
    text,
    html,
  });
}
