import { getEnv } from "../config/env";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: SendEmailInput) {
  const env = getEnv();
  if (!env.RESEND_API_KEY || !env.SMTP_FROM) {
    if (env.NODE_ENV === "production") {
      throw new Error("Resend não configurado em produção");
    }

    console.log("[email:mock]", { to, subject, html });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.SMTP_FROM,
        to,
        subject,
        html,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Falha ao enviar e-mail via Resend: ${response.status} ${detail}`);
    }
  } finally {
    clearTimeout(timeout);
  }
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
