'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getApplicationStatus, useWizardStore } from '../lib/stores/wizard-store';
import AccountStep from './steps/AccountStep';
import PropertyStep from './steps/PropertyStep';
import LocalAgentStep from './steps/LocalAgentStep';
import DocumentsStep from './steps/DocumentsStep';
import PaymentStep from './steps/PaymentStep';

export default function ApplicationWizard() {
  const searchParams = useSearchParams();
  const {
    currentStep,
    isDraftSaving,
    lastSavedAt,
    draftRestoredAt,
    draftHasMissingUploads,
    applicationNumber,
    submittedAt,
    account,
    property,
    localAgent,
    documents,
    payment,
    hydrateDraft,
    saveDraft,
    setApplicationNumber,
    markSubmitted,
    reset,
  } = useWizardStore();
  const [paymentVerificationMessage, setPaymentVerificationMessage] = useState<string | null>(null);
  const applicationStatus = getApplicationStatus(useWizardStore.getState());
  const hasDraftableData = Boolean(
    account.firstName ||
      account.lastName ||
      account.email ||
      property.address ||
      localAgent.firstName ||
      documents.certifiesAccuracy ||
      payment.acknowledgesLicenseDisplay
  );

  useEffect(() => {
    hydrateDraft();
  }, [hydrateDraft]);

  useEffect(() => {
    const stripeStatus = searchParams.get('stripe');
    const sessionId = searchParams.get('session_id');
    let cancelled = false;

    const pause = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

    const verifyPayment = async () => {
      if (stripeStatus !== 'success' || !sessionId || submittedAt) {
        return;
      }

      setPaymentVerificationMessage('Confirming Stripe payment with county intake records...');

      for (let attempt = 0; attempt < 6; attempt += 1) {
        const response = await fetch(
          `/api/stripe/payment-status?session_id=${encodeURIComponent(sessionId)}`,
          { cache: 'no-store' }
        );

        if (response.ok) {
          const data = (await response.json()) as {
            found: boolean;
            status: 'pending' | 'paid' | 'failed';
            applicationNumber?: string;
            submittedAt?: string | null;
            paidAt?: string | null;
          };

          if (data.found && data.status === 'paid') {
            if (data.applicationNumber) {
              setApplicationNumber(data.applicationNumber);
            }
            markSubmitted(data.submittedAt ?? data.paidAt ?? new Date().toISOString());
            if (!cancelled) {
              setPaymentVerificationMessage(null);
            }
            return;
          }

          if (data.found && data.status === 'failed') {
            if (!cancelled) {
              setPaymentVerificationMessage(
                'Stripe reported a failed payment. Please retry the county fee payment.'
              );
            }
            return;
          }
        }

        await pause(1500);
      }

      if (!cancelled) {
        setPaymentVerificationMessage(
          'Payment is still pending confirmation. Refresh in a few seconds or retry from Payment step.'
        );
      }
    };

    if (stripeStatus === 'cancelled') {
      setPaymentVerificationMessage('Stripe checkout was cancelled. You can retry payment when ready.');
      return;
    }

    void verifyPayment();

    return () => {
      cancelled = true;
    };
  }, [markSubmitted, searchParams, setApplicationNumber, submittedAt]);

  useEffect(() => {
    if (!hasDraftableData || submittedAt) {
      return;
    }

    const timeout = window.setTimeout(() => {
      saveDraft();
    }, 1200);

    return () => window.clearTimeout(timeout);
  }, [
    account,
    property,
    localAgent,
    documents,
    payment,
    currentStep,
    hasDraftableData,
    submittedAt,
    saveDraft,
  ]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!hasDraftableData || submittedAt) {
      return;
    }

    const interval = setInterval(() => {
      saveDraft();
    }, 30000);

    return () => clearInterval(interval);
  }, [hasDraftableData, submittedAt, saveDraft]);

  const renderStep = () => {
    switch (currentStep) {
      case 'account':
        return <AccountStep />;
      case 'property':
        return <PropertyStep />;
      case 'local-agent':
        return <LocalAgentStep />;
      case 'documents':
        return <DocumentsStep />;
      case 'payment':
        return <PaymentStep />;
      default:
        return null;
    }
  };

  return (
    <div className="wizard-container">
      <div className="wizard-header">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
                applicationStatus === 'submitted'
                  ? 'bg-emerald-100 text-emerald-800'
                  : applicationStatus === 'ready-for-submission'
                    ? 'bg-blue-100 text-blue-800'
                    : applicationStatus === 'ineligible'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-slate-100 text-slate-700'
              }`}
            >
              {applicationStatus.replace(/-/g, ' ')}
            </span>
            {applicationNumber && (
              <span className="text-sm font-medium text-slate-700">
                Application No. {applicationNumber}
              </span>
            )}
          </div>

          {hasDraftableData && !submittedAt && (
            <button
              type="button"
              onClick={reset}
              className="text-sm font-medium text-slate-500 hover:text-slate-800"
            >
              Clear local draft
            </button>
          )}
        </div>

        {draftRestoredAt && (
          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <div className="font-medium">Saved draft restored from this browser.</div>
            <div className="mt-1 text-blue-800">
              Restored at {draftRestoredAt.toLocaleTimeString()}.
              {draftHasMissingUploads
                ? ' Uploaded documents must be attached again before submission.'
                : ' You can continue where you left off.'}
            </div>
          </div>
        )}

        {paymentVerificationMessage && !submittedAt && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {paymentVerificationMessage}
          </div>
        )}

        <div className="wizard-progress">
          <WizardProgressBar />
        </div>
        {lastSavedAt && (
          <div className="wizard-save-indicator">
            {isDraftSaving ? (
              <span className="text-sm text-gray-500">Saving...</span>
            ) : (
              <span className="text-sm text-green-600">
                Last saved: {lastSavedAt.toLocaleTimeString()}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="wizard-content">{renderStep()}</div>
    </div>
  );
}

function WizardProgressBar() {
  const { currentStep } = useWizardStore();
  const steps = ['account', 'property', 'local-agent', 'documents', 'payment'];
  const currentIndex = steps.indexOf(currentStep as any);

  return (
    <div className="flex gap-2 items-center">
      {steps.map((step, index) => (
        <React.Fragment key={step}>
          <div
            className={`h-2 w-12 rounded-full transition-colors ${
              index <= currentIndex ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          />
          {index < steps.length - 1 && (
            <div
              className={`h-1 w-8 transition-colors ${
                index < currentIndex ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
