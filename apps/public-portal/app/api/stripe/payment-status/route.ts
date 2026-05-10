import { NextRequest, NextResponse } from 'next/server';
import { findPaymentRecord } from '../../../../lib/server/stripe-payment-registry';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');
  const applicationNumber = searchParams.get('application_number');

  if (!sessionId && !applicationNumber) {
    return NextResponse.json(
      { error: 'Provide session_id or application_number.' },
      { status: 400 }
    );
  }

  const record = await findPaymentRecord({
    checkoutSessionId: sessionId,
    applicationNumber,
  });

  if (!record) {
    return NextResponse.json({ found: false, status: 'pending' }, { status: 200 });
  }

  return NextResponse.json({
    found: true,
    status: record.paymentStatus,
    applicationNumber: record.applicationNumber,
    checkoutSessionId: record.checkoutSessionId,
    paymentIntentId: record.paymentIntentId,
    paidAt: record.paidAt,
    submittedAt: record.submittedAt,
    updatedAt: record.updatedAt,
  });
}