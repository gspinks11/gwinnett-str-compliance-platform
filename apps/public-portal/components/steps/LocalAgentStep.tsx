'use client';

import React, { useState } from 'react';
import { useWizardStore } from '../../lib/stores/wizard-store';

export default function LocalAgentStep() {
  const { localAgent, updateLocalAgent, nextStep, previousStep } = useWizardStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!localAgent.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!localAgent.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!localAgent.email.includes('@')) newErrors.email = 'Valid email is required';
    if (!localAgent.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!localAgent.contactAvailability) {
      newErrors.contactAvailability = 'Response availability is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (nextStep()) {
        // Successfully moved to next step
      }
    } catch (error) {
      console.error('Failed to update local agent:', error);
      setErrors({ form: 'Failed to update agent information' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="wizard-step">
      <div className="wizard-step-content">
        <div className="max-w-xl">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Responsible Local Contact</h2>
            <p className="text-gray-600">
              Provide the person county staff, code enforcement, or emergency responders can contact
              regarding this STR operation.
            </p>
          </div>

          {errors.form && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">{errors.form}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First name
                </label>
                <input
                  type="text"
                  value={localAgent.firstName}
                  onChange={(e) => updateLocalAgent({ firstName: e.target.value })}
                  className={`portal-input w-full ${errors.firstName ? 'border-red-500' : ''}`}
                  placeholder="Jane"
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last name
                </label>
                <input
                  type="text"
                  value={localAgent.lastName}
                  onChange={(e) => updateLocalAgent({ lastName: e.target.value })}
                  className={`portal-input w-full ${errors.lastName ? 'border-red-500' : ''}`}
                  placeholder="Smith"
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                type="email"
                value={localAgent.email}
                onChange={(e) => updateLocalAgent({ email: e.target.value })}
                className={`portal-input w-full ${errors.email ? 'border-red-500' : ''}`}
                placeholder="jane@example.com"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile phone
              </label>
              <input
                type="tel"
                value={localAgent.phone}
                onChange={(e) => updateLocalAgent({ phone: e.target.value })}
                className={`portal-input w-full ${errors.phone ? 'border-red-500' : ''}`}
                placeholder="(555) 123-4567"
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company (optional)
              </label>
              <input
                type="text"
                value={localAgent.company}
                onChange={(e) => updateLocalAgent({ company: e.target.value })}
                className="portal-input w-full"
                placeholder="Management company or host team"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business or license number (optional)
              </label>
              <input
                type="text"
                value={localAgent.licenseNumber}
                onChange={(e) => updateLocalAgent({ licenseNumber: e.target.value })}
                className="portal-input w-full"
                placeholder="Example: PM123456"
              />
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-medium text-gray-900">Response availability</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => updateLocalAgent({ contactAvailability: '24-7' })}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                    localAgent.contactAvailability === '24-7'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700'
                  }`}
                >
                  24/7 response
                </button>
                <button
                  type="button"
                  onClick={() => updateLocalAgent({ contactAvailability: 'business-hours' })}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                    localAgent.contactAvailability === 'business-hours'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700'
                  }`}
                >
                  Business hours only
                </button>
              </div>
              {errors.contactAvailability && (
                <p className="text-red-500 text-sm mt-2">{errors.contactAvailability}</p>
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
                className="portal-pill px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : 'Continue to documentation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
