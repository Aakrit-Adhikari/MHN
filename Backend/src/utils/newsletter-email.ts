import nodemailer from "nodemailer";
import path from "path";
import { env } from "../config/env.js";

type NewsletterEmailInput = {
    subject: string;
    previewText?: string | null;
    contentHtml: string;
    contentText?: string | null;
    recipientEmail: string;
    recipientName?: string | null;
    unsubscribeToken?: string | null;
};

type SendNewsletterEmailInput = NewsletterEmailInput & {
    to: string;
};

const brandName = "Mountain Helicopters Nepal";
const logoPath = "/uploads/newsletters/mhn-logo.png";
const logoCid = "mhn-logo";

function baseUrl() {
    return env.PUBLIC_APP_URL.replace(/\/$/, "");
}

function escapeHtml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function stripHtml(value: string) {
    return value
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function requireSmtpConfig() {
    const missing = [
        ["NEWSLETTER_FROM_EMAIL", env.NEWSLETTER_FROM_EMAIL],
        ["SMTP_HOST", env.SMTP_HOST],
        ["SMTP_USER", env.SMTP_USER],
        ["SMTP_PASS", env.SMTP_PASS],
    ].filter(([, value]) => !value).map(([key]) => key);

    if (missing.length) {
        throw new Error(`SMTP email is not configured. Missing: ${missing.join(", ")}`);
    }
}

function fromAddress() {
    return `"${env.NEWSLETTER_FROM_NAME}" <${env.NEWSLETTER_FROM_EMAIL}>`;
}

export function buildNewsletterEmail(
    input: NewsletterEmailInput,
    options: { logoSrc?: string } = {}
) {
    const appUrl = baseUrl();
    const logoUrl = options.logoSrc ?? `${appUrl}${logoPath}`;
    const unsubscribeUrl = input.unsubscribeToken
        ? `${appUrl}/api/newsletter/unsubscribe?token=${encodeURIComponent(input.unsubscribeToken)}`
        : null;
    const previewText = input.previewText ?? "";
    const greeting = input.recipientName ? `Hi ${escapeHtml(input.recipientName)},` : "Hi,";
    const footerText = unsubscribeUrl
        ? `You are receiving this email because you subscribed to ${brandName} updates.`
        : `This is a ${brandName} newsletter preview.`;

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(input.subject)}</title>
</head>
<body style="margin:0;background:#f4f7fb;color:#132238;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(previewText)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #d9e3ef;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="padding:26px 28px 18px;border-bottom:4px solid #0b62a8;">
              <img src="${logoUrl}" width="260" alt="Mountain Helicopters Nepal Pvt. Ltd." style="display:block;max-width:260px;width:100%;height:auto;">
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 18px;font-size:16px;line-height:24px;color:#132238;">${greeting}</p>
              <div style="font-size:16px;line-height:25px;color:#132238;">${input.contentHtml}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 28px;background:#0b2540;color:#dbe9f6;font-size:12px;line-height:18px;">
              <p style="margin:0 0 10px;">${footerText}</p>
              ${unsubscribeUrl ? `<p style="margin:0;"><a href="${unsubscribeUrl}" style="color:#ffffff;text-decoration:underline;">Unsubscribe</a></p>` : ""}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const textParts = [
        brandName,
        input.subject,
        input.recipientName ? `Hi ${input.recipientName},` : "Hi,",
        input.contentText ?? stripHtml(input.contentHtml),
        footerText,
        unsubscribeUrl ? `Unsubscribe: ${unsubscribeUrl}` : "",
    ].filter(Boolean);

    return {
        html,
        text: textParts.join("\n\n"),
        logoUrl,
        unsubscribeUrl,
    };
}

export async function sendNewsletterEmail(input: SendNewsletterEmailInput) {
    const email = buildNewsletterEmail(input);
    const provider = env.NEWSLETTER_EMAIL_PROVIDER.toLowerCase();

    if (provider === "smtp") {
        requireSmtpConfig();
        const smtpEmail = buildNewsletterEmail(input, { logoSrc: `cid:${logoCid}` });

        const transport = nodemailer.createTransport({
            host: env.SMTP_HOST,
            port: env.SMTP_PORT,
            secure: env.SMTP_SECURE,
            auth: {
                user: env.SMTP_USER,
                pass: env.SMTP_PASS,
            },
        });

        const result = await transport.sendMail({
            from: fromAddress(),
            to: input.to,
            subject: input.subject,
            html: smtpEmail.html,
            text: smtpEmail.text,
            attachments: [
                {
                    filename: "mhn-logo.png",
                    path: path.join(process.cwd(), "uploads/newsletters/mhn-logo.png"),
                    cid: logoCid,
                },
            ],
        });

        return {
            provider,
            messageId: result.messageId,
            html: smtpEmail.html,
            text: smtpEmail.text,
        };
    }

    console.info("Newsletter email prepared", {
        provider,
        to: input.to,
        subject: input.subject,
        logoUrl: email.logoUrl,
    });

    return {
        provider,
        messageId: `mock-${Date.now()}`,
        html: email.html,
        text: email.text,
    };
}
