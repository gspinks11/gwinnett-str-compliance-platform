import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { upsertCheckoutSessionRecord } from '../../../../lib/server/stripe-payment-registry';

export const runtime = 'nodejs';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePriceId = process.env.STRIPE_PRICE_ID;

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    })
  : null;

export async function POST(request: NextRequest) {
  if (!stripe || !stripePriceId) {
    return NextResponse.json(
      { error: 'Stripe is not configured. Set STRIPE_SECRET_KEY and STRIPE_PRICE_ID.' },
      { status: 500 }
    );
  }

  let body: {
    applicantEmail?: string;
    applicantName?: string;
    billingName?: string;
    propertyAddress?: string;
    applicationNumber?: string | null;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const origin = request.headers.get('origin') ?? new URL(request.url).origin;
  const fallbackApplicationNumber = `GWIN-STR-${Date.now().toString().slice(-6)}`;
  const applicationNumber = body.applicationNumber?.trim() || fallbackApplicationNumber;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: stripePriceId, quantity: 1 }],
      customer_email: body.applicantEmail?.trim() || undefined,
      metadata: {
        applicationNumber,
        applicantEmail: body.applicantEmail?.trim() || '',
        applicantName: body.applicantName?.trim() || '',
        billingName: body.billingName?.trim() || '',
        propertyAddress: body.propertyAddress?.trim() || '',
      },
      payment_intent_data: {
        metadata: {
          applicationNumber,
          applicantEmail: body.applicantEmail?.trim() || '',
          applicantName: body.applicantName?.trim() || '',
          billingName: body.billingName?.trim() || '',
          propertyAddress: body.propertyAddress?.trim() || '',
        },
      },
      success_url: `${origin}/application?stripe=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/application?stripe=cancelled`,
    });

    await upsertCheckoutSessionRecord({
      applicationNumber,
      checkoutSessionId: session.id,
      amountTotal: session.amount_total,
      currency: session.currency,
      paymentIntentId:
        typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null,
    });

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
      applicationNumber,
    });
  } catch (error) {
    console.error('Failed to create Stripe checkout session:', error);
    return NextResponse.json(
      { error: 'Unable to start Stripe checkout. Please try again.' },
      { status: 500 }
    );
  }
}