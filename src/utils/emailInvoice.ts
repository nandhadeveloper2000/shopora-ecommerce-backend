import { Resend } from "resend";
import { env } from "../config/env";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export async function sendInvoiceEmail(params: {
  to: string;
  subject: string;
  html: string;
  pdfBuffer: Buffer;
  filename: string;
}) {
  if (!env.INVOICE_EMAIL_ENABLED || !resend || !env.RESEND_FROM_EMAIL) {
    return { skipped: true };
  }

  const result = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: [params.to],
    subject: params.subject,
    html: params.html,
    attachments: [
      {
        filename: params.filename,
        content: params.pdfBuffer,
      },
    ],
  });

  return result;
}