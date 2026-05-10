'use client';

import React, { useState } from 'react';
import { useWizardStore } from '../../lib/stores/wizard-store';

export default function PaymentStep() {
  const {
    payment,
    updatePayment,
    previousStep,
    applicationNumber,
    submittedAt,
    account,
    property,
    setApplicationNumber,
    saveDraft,
  } = useWizardStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (submittedAt && applicationNumber) {
    return (
      <div className="wizard-step">
        <div className="wizard-step-content">
          <div className="max-w-xl space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">Application submitted for county review</h2>
              <p className="text-gray-600">
                The licensing packet is now in the review queue for authority verification, property eligibility review, and evidence validation.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Review queue
              </div>
              <div className="mt-3 text-2xl font-bold text-emerald-950">{applicationNumber}</div>
              <p className="mt-3 text-sm leading-6 text-emerald-900/90">
                Submitted on {new Date(submittedAt).toLocaleString()}. Keep this number for any county follow-up or correction requests.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!payment.acknowledgesLicenseDisplay) {
      setErrors({
        acknowledgesLicenseDisplay: 'You must acknowledge the county license display requirement',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      setErrors({});

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationNumber,
          applicantEmail: account.email,
          applicantName: `${account.firstName} ${account.lastName}`.trim(),
          billingName: payment.cardholderName.trim(),
          propertyAddress: property.address,
        }),
      });

      const data = (await response.json()) as {
        checkoutUrl?: string;
        applicationNumber?: string;
        error?: string;
      };

      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data.error || 'Unable to start Stripe checkout.');
      }

      if (data.applicationNumber) {
        setApplicationNumber(data.applicationNumber);
        await saveDraft();
      }

      window.location.assign(data.checkoutUrl);
    } catch (error) {
      console.error('Payment setup failed:', error);
      setErrors({ form: error instanceof Error ? error.message : 'Payment processing failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="wizard-step">
      <div className="wizard-step-content">
        <div className="max-w-xl">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Fee Payment and County Submission</h2>
            <p className="text-gray-600">
              Pay the license fee through Stripe Checkout and send the completed application into the county review queue.
            </p>
          </div>

          {errors.form && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">{errors.form}</div>
          )}

          <div className="border border-gray-200 rounded-lg p-6 mb-8 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">Annual STR License Fee</span>
              <span className="text-2xl font-bold text-gray-900">$500.00</span>
            </div>
            <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
              <span className="font-medium text-gray-900">Total Due</span>
              <span className="text-2xl font-bold text-blue-600">$500.00</span>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Stripe will collect payment in sandbox mode using your test price id. The STR may not operate until the county approves and issues the license.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Billing Name
              </label>
              <input
                type="text"
                value={payment.cardholderName}
                onChange={(e) => updatePayment({ cardholderName: e.target.value })}
                className="portal-input w-full"
                placeholder="Billing name on Stripe receipt"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> This is a Stripe sandbox handoff. Clicking submit will open hosted Checkout with your configured test price id.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 p-5 space-y-4">
              <h3 className="text-base font-semibold text-gray-900">Final submission acknowledgment</h3>
              <label className="flex items-start gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={payment.acknowledgesLicenseDisplay}
                  onChange={(e) =>
                    updatePayment({ acknowledgesLicenseDisplay: e.target.checked })
                  }
                  className="mt-1"
                />
                <span>
                  I understand that if the county approves this application, the issued license may need to be printed, displayed, or produced as evidence of lawful STR operation.
                </span>
              </label>
              {errors.acknowledgesLicenseDisplay && (
                <p className="text-red-500 text-sm">{errors.acknowledgesLicenseDisplay}</p>
              )}
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={previousStep}
                className="px-8 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="portal-pill px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1"
              >
                {isSubmitting ? 'Opening Stripe Checkout...' : 'Submit for County Review and Pay $500'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
