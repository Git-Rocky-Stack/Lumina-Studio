/**
 * Stripe Service
 *
 * Handles Stripe checkout session creation and payment flows.
 */

import { loadStripe, Stripe } from '@stripe/stripe-js';

// Stripe publishable key
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51SgEqD4cobjFYu5A0uRQRoNienAcdNNUCoxX0s09i4f1OZGCBSrYyi6BktxbWZMSN1eTzRdBZ8LNjKNlpSRKNjkU00IoFDyq30';

// API base URL for Cloudflare Worker
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.lumina-os.com';

// Stripe instance (lazy loaded)
let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Get the Stripe instance (lazy loaded)
 */
export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

/**
 * Price IDs for each plan (to be created in Stripe Dashboard)
 * These should match the prices configured in your Stripe account
 */
export const STRIPE_PRICE_IDS = {
  starter: {
    monthly: 'price_starter_monthly', // $12/month
    yearly: 'price_starter_yearly',   // $10/month billed annually
  },
  pro: {
    monthly: 'price_pro_monthly',     // $29/month
    yearly: 'price_pro_yearly',       // $24/month billed annually
  },
  team: {
    monthly: 'price_team_monthly',    // $79/month
    yearly: 'price_team_yearly',      // $65/month billed annually
  },
} as const;

export type PlanName = keyof typeof STRIPE_PRICE_IDS;
export type BillingInterval = 'monthly' | 'yearly';

/**
 * Create a checkout session for a subscription
 */
export async function createCheckoutSession(
  planName: PlanName,
  interval: BillingInterval,
  userEmail?: string,
  userId?: string
): Promise<{ sessionId: string; url: string }> {
  const priceId = STRIPE_PRICE_IDS[planName][interval];

  const response = await fetch(`${API_BASE_URL}/v1/stripe/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      priceId,
      planName,
      interval,
      userEmail,
      userId,
      successUrl: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${window.location.origin}/checkout/cancel`,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create checkout session');
  }

  return response.json();
}

/**
 * Redirect to Stripe Checkout
 */
export async function redirectToCheckout(
  planName: PlanName,
  interval: BillingInterval,
  userEmail?: string,
  userId?: string
): Promise<void> {
  const stripe = await getStripe();

  if (!stripe) {
    throw new Error('Stripe failed to load');
  }

  const { sessionId } = await createCheckoutSession(planName, interval, userEmail, userId);

  const { error } = await stripe.redirectToCheckout({ sessionId });

  if (error) {
    throw new Error(error.message || 'Failed to redirect to checkout');
  }
}

/**
 * Create a billing portal session for managing subscriptions
 */
export async function createBillingPortalSession(
  customerId: string
): Promise<{ url: string }> {
  const response = await fetch(`${API_BASE_URL}/v1/stripe/create-portal-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerId,
      returnUrl: `${window.location.origin}/settings`,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create portal session');
  }

  return response.json();
}

/**
 * Get subscription status for a user
 */
export async function getSubscriptionStatus(userId: string): Promise<{
  active: boolean;
  plan: PlanName | 'free';
  interval: BillingInterval | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}> {
  const response = await fetch(`${API_BASE_URL}/v1/stripe/subscription-status`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    // Default to free tier if no subscription found
    return {
      active: false,
      plan: 'free',
      interval: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    };
  }

  return response.json();
}
