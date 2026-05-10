'use client';

import React, { useState } from 'react';
import { ApplicantRole, useWizardStore } from '../../lib/stores/wizard-store';

const APPLICANT_ROLES: Array<{ value: ApplicantRole; label: string }> = [
  { value: '', label: 'Select applicant role...' },
  { value: 'owner', label: 'Property owner' },
  { value: 'tenant', label: 'Tenant operator' },
  { value: 'authorized-agent', label: 'Authorized agent' },
  { value: 'property-manager', label: 'Property manager' },
];

export default function AccountStep() {
  const { account, updateAccount, nextStep } = useWizardStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!account.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!account.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!account.email.includes('@')) newErrors.email = 'Valid email is required';
    if (!account.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!account.applicantRole) newErrors.applicantRole = 'Applicant role is required';
    if (account.isPropertyOwner === null) newErrors.isPropertyOwner = 'Please confirm ownership status';
    if (account.hasOwnerAuthorization === null) {
      newErrors.hasOwnerAuthorization = 'Please confirm whether you have authority to file';
    }
    if (!account.isPropertyOwner && !account.hasOwnerAuthorization) {
      newErrors.hasOwnerAuthorization = 'Written owner authorization is required to continue';
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
        setErrors({});
      }
    } catch (error) {
      console.error('Applicant step failed:', error);
      setErrors({ form: 'Failed to save applicant information' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="wizard-step">
      <div className="wizard-step-content">
        <div className="max-w-xl">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Applicant and Operating Authority</h2>
            <p className="text-gray-600">
              Identify who is applying to operate the short-term rental and whether that person has
              legal authority to offer the room or home for STR use.
            </p>
          </div>

          {errors.form && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">{errors.form}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First name
                </label>
                <input
                  type="text"
                  value={account.firstName}
                  onChange={(e) => updateAccount({ firstName: e.target.value })}
                  className={`portal-input w-full ${errors.firstName ? 'border-red-500' : ''}`}
                  placeholder="John"
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
                  value={account.lastName}
                  onChange={(e) => updateAccount({ lastName: e.target.value })}
                  className={`portal-input w-full ${errors.lastName ? 'border-red-500' : ''}`}
                  placeholder="Doe"
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
                value={account.email}
                onChange={(e) => updateAccount({ email: e.target.value })}
                className={`portal-input w-full ${errors.email ? 'border-red-500' : ''}`}
                placeholder="john@example.com"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile phone
              </label>
              <input
                type="tel"
                value={account.phone}
                onChange={(e) => updateAccount({ phone: e.target.value })}
                className={`portal-input w-full ${errors.phone ? 'border-red-500' : ''}`}
                placeholder="(555) 123-4567"
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Applicant role
              </label>
              <select
                value={account.applicantRole}
                onChange={(e) => updateAccount({ applicantRole: e.target.value as ApplicantRole })}
                className={`portal-input w-full ${errors.applicantRole ? 'border-red-500' : ''}`}
              >
                {APPLICANT_ROLES.map((role) => (
                  <option key={role.value || 'blank'} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              {errors.applicantRole && (
                <p className="text-red-500 text-sm mt-1">{errors.applicantRole}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-900">Are you the legal property owner?</p>
                <div className="mt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => updateAccount({ isPropertyOwner: true })}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                      account.isPropertyOwner === true
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => updateAccount({ isPropertyOwner: false })}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                      account.isPropertyOwner === false
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    No
                  </button>
                </div>
                {errors.isPropertyOwner && (
                  <p className="text-red-500 text-sm mt-2">{errors.isPropertyOwner}</p>
                )}
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-900">Do you have written authorization to operate this STR?</p>
                <div className="mt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => updateAccount({ hasOwnerAuthorization: true })}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                      account.hasOwnerAuthorization === true
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => updateAccount({ hasOwnerAuthorization: false })}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                      account.hasOwnerAuthorization === false
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    No
                  </button>
                </div>
                {errors.hasOwnerAuthorization && (
                  <p className="text-red-500 text-sm mt-2">{errors.hasOwnerAuthorization}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Operating business or entity name (optional)
              </label>
              <input
                type="text"
                value={account.operatingEntityName}
                onChange={(e) => updateAccount({ operatingEntityName: e.target.value })}
                className="portal-input w-full"
                placeholder="Example: Peach Host Services LLC"
              />
              <p className="text-xs text-gray-500 mt-2">
                Leave blank if you are operating the STR as an individual owner or resident.
              </p>
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="portal-pill px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : 'Continue to property eligibility'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
