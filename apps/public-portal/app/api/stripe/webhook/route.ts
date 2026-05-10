import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { markPaymentFailed, markPaymentSucceeded } from '../../../../lib/server/stripe-payment-registry';

export const runtime = 'nodejs';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    })
  : null;

export async function POST(request: NextRequest) {
  if (!stripe || !stripeWebhookSecret) {
    return NextResponse.json(
      { error: 'Stripe is not configured. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET.' },
      { status: 500 }
    );
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature.' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const payload = await request.text();
    event = stripe.webhooks.constructEvent(payload, signature, stripeWebhookSecret);
  } catch (error) {
    console.error('Invalid Stripe webhook signature:', error);
    return NextResponse.json({ error: 'Invalid Stripe webhook signature.' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const applicationNumber = session.metadata?.applicationNumber ?? 'unknown';

      if (applicationNumber !== 'unknown') {
        if (session.payment_status === 'paid') {
          await markPaymentSucceeded({
            applicationNumber,
            checkoutSessionId: session.id,
            amountTotal: session.amount_total,
            currency: session.currency,
            paymentIntentId:
              typeof session.payment_intent === 'string'
                ? session.payment_intent
                : session.payment_intent?.id ?? null,
            eventType: event.type,
            eventId: event.id,
            paidAt: new Date(event.created * 1000).toISOString(),
          });
        } else {
          await markPaymentFailed({
            applicationNumber,
            checkoutSessionId: session.id,
            amountTotal: session.amount_total,
            currency: session.currency,
            paymentIntentId:
              typeof session.payment_intent === 'string'
                ? session.payment_intent
                : session.payment_intent?.id ?? null,
            eventType: event.type,
            eventId: event.id,
          });
        }
      }

      console.info('Stripe checkout completed for county fee payment', {
        applicationNumber,
        sessionId: session.id,
        paymentStatus: session.payment_status,
        customerEmail: session.customer_email,
        amountTotal: session.amount_total,
      });
      break;
    }
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const applicationNumber = paymentIntent.metadata?.applicationNumber ?? 'unknown';

      if (applicationNumber !== 'unknown') {
        const checkoutSessionId =
          typeof paymentIntent.metadata?.checkoutSessionId === 'string'
            ? paymentIntent.metadata.checkoutSessionId
            : `intent:${paymentIntent.id}`;

        await markPaymentSucceeded({
          applicationNumber,
          checkoutSessionId,
          amountTotal: paymentIntent.amount_received,
          currency: paymentIntent.currency,
          paymentIntentId: paymentIntent.id,
          eventType: event.type,
          eventId: event.id,
          paidAt: new Date(event.created * 1000).toISOString(),
        });
      }

      console.info('Stripe payment intent succeeded for county fee payment', {
        applicationNumber,
        paymentIntentId: paymentIntent.id,
        amountReceived: paymentIntent.amount_received,
      });
      break;
    }
    case 'checkout.session.async_payment_failed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const applicationNumber = session.metadata?.applicationNumber ?? 'unknown';

      if (applicationNumber !== 'unknown') {
        await markPaymentFailed({
          applicationNumber,
          checkoutSessionId: session.id,
          amountTotal: session.amount_total,
          currency: session.currency,
          paymentIntentId:
            typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null,
          eventType: event.type,
          eventId: event.id,
        });
      }

      console.info('Stripe checkout payment failed for county fee payment', {
        applicationNumber,
        sessionId: session.id,
        paymentStatus: session.payment_status,
      });
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}