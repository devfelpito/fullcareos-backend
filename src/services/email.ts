import nodemailer from "nodemailer";
import { getEnv } from "../config/env";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

function buildTransport() {
  const env = getEnv();
  if (!env.SMTP_HOST || !env.SMTP_PORT || !env.SMTP_USER || !env.SMTP_PASS || !env.SMTP_FROM) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

export async function sendEmail({ to, subject, html }: SendEmailInput) {
  const env = getEnv();
  const transport = buildTransport();

  if (!transport) {
    if (env.NODE_ENV === "production") {
      throw new Error("SMTP não configurado em produção");
    }

    console.log("[email:mock]", { to, subject, html });
    return;
  }

  await transport.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    html,
  });
}

export async function sendVerificationEmail(params: {
  to: string;
  companySlug: string;
  email: string;
  token: string;
  customer: boolean;
}) {
  const env = getEnv();
  const base = env.APP_BASE_URL || "http://localhost:3001";

  const path = params.customer
    ? `/c/${params.companySlug}/verificar-email`
    : `/auth/verify-email`;

  const link = `${base}${path}?email=${encodeURIComponent(params.email)}&token=${encodeURIComponent(params.token)}${params.customer ? "" : `&companySlug=${encodeURIComponent(params.companySlug)}`}`;

  await sendEmail({
    to: params.to,
    subject: "Verifique seu e-mail",
    html: `<p>Olá,</p><p>Clique no link para verificar seu e-mail:</p><p><a href="${link}">${link}</a></p>`,
  });
}

export async function sendResetPasswordEmail(params: {
  to: string;
  companySlug: string;
  email: string;
  token: string;
  customer: boolean;
}) {
  const env = getEnv();
  const base = env.APP_BASE_URL || "http://localhost:3001";

  const path = params.customer
    ? `/c/${params.companySlug}/redefinir-senha`
    : `/auth/reset-password`;

  const link = `${base}${path}?email=${encodeURIComponent(params.email)}&token=${encodeURIComponent(params.token)}${params.customer ? "" : `&companySlug=${encodeURIComponent(params.companySlug)}`}`;

  await sendEmail({
    to: params.to,
    subject: "Redefinição de senha",
    html: `<p>Olá,</p><p>Clique no link para redefinir sua senha:</p><p><a href="${link}">${link}</a></p>`,
  });
}
