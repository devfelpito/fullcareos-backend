import crypto from "crypto";
import { getEnv } from "../config/env";

type BillingPlan = "monthly" | "quarterly" | "yearly";

type CheckoutInput = {
  plan: BillingPlan;
  companyName: string;
  companyEmail: string;
  companyId: string;
};

const PLAN_PRICE_MAP: Record<BillingPlan, number> = {
  monthly: 129,
  quarterly: 349,
  yearly: 1188,
};

function getStripePriceId(plan: BillingPlan, env = getEnv()) {
  if (plan === "monthly") return env.STRIPE_PRICE_MONTHLY;
  if (plan === "quarterly") return env.STRIPE_PRICE_QUARTERLY;
  return env.STRIPE_PRICE_YEARLY;
}

export async function createCheckoutSession(input: CheckoutInput) {
  const env = getEnv();

  if (env.BILLING_PROVIDER === "stripe") {
    if (!env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY não configurada");
    }

    const priceId = getStripePriceId(input.plan, env);
    if (!priceId) {
      throw new Error(`Preço Stripe não configurado para plano ${input.plan}`);
    }

    const payload = new URLSearchParams({
      mode: "subscription",
      success_url: `${env.APP_BASE_URL || "http://localhost:3001"}/dashboard?billing=success`,
      cancel_url: `${env.APP_BASE_URL || "http://localhost:3001"}/dashboard?billing=cancel`,
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      client_reference_id: input.companyId,
      "metadata[companyId]": input.companyId,
      "metadata[companyName]": input.companyName,
      "metadata[plan]": input.plan,
      customer_email: input.companyEmail,
    });

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || "Falha ao criar checkout Stripe");
    }

    return {
      provider: "stripe",
      checkoutUrl: data.url as string,
      externalId: data.id as string,
    };
  }

  const fakeSessionId = crypto.randomUUID();
  return {
    provider: "mock",
    checkoutUrl: `${env.APP_BASE_URL || "http://localhost:3001"}/billing/mock-checkout?session=${fakeSessionId}&plan=${input.plan}&value=${PLAN_PRICE_MAP[input.plan]}`,
    externalId: fakeSessionId,
  };
}
