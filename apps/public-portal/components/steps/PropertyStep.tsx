'use client';

import React, { useState } from 'react';
import {
  getEligibilityBlockers,
  GovernanceType,
  OperationType,
  PropertyType,
  useWizardStore,
} from '../../lib/stores/wizard-store';

const PROPERTY_TYPES: Array<{ value: PropertyType; label: string }> = [
  { value: '', label: 'Select property type...' },
  { value: 'single-family', label: 'Single-Family Home' },
  { value: 'multi-family', label: 'Multi-Family' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'condo', label: 'Condo' },
];

const GOVERNANCE_TYPES: Array<{ value: GovernanceType; label: string }> = [
  { value: '', label: 'Select property governance...' },
  { value: 'none', label: 'No HOA or condo association' },
  { value: 'hoa', label: 'Homeowners association (HOA)' },
  { value: 'condo-association', label: 'Condo association' },
];

const OPERATION_TYPES: Array<{ value: OperationType; label: string }> = [
  { value: '', label: 'Select STR operation type...' },
  { value: 'hosted-room', label: 'Hosted room inside occupied home' },
  { value: 'whole-home', label: 'Whole-home or full-unit STR' },
];

export default function PropertyStep() {
  const { account, property, updateProperty, nextStep, previousStep } = useWizardStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const eligibilityBlockers = getEligibilityBlockers({ account, property });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!property.address.trim()) newErrors.address = 'Address is required';
    if (!property.city.trim()) newErrors.city = 'City is required';
    if (!property.state.trim()) newErrors.state = 'State is required';
    if (!property.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
    if (!property.propertyType) newErrors.propertyType = 'Property type is required';
    if (!property.governanceType) newErrors.governanceType = 'Property governance is required';
    if (property.governanceType !== 'none' && property.hoaAllowsStr === null) {
      newErrors.hoaAllowsStr = 'You must disclose whether HOA or condo rules allow STR use';
    }
    if (!property.operationType) newErrors.operationType = 'STR operation type is required';
    if (property.ownerOccupied === null) newErrors.ownerOccupied = 'Owner occupancy is required';
    if (property.primaryResidence === null) newErrors.primaryResidence = 'Primary residence status is required';
    if (!property.totalBedrooms || property.totalBedrooms <= 0) {
      newErrors.totalBedrooms = 'Total bedrooms is required';
    }
    if (!property.strBedrooms || property.strBedrooms <= 0) {
      newErrors.strBedrooms = 'Bedrooms offered as STR is required';
    }
    if (property.strBedrooms > property.totalBedrooms) {
      newErrors.strBedrooms = 'STR bedrooms cannot exceed total bedrooms in the home';
    }
    if (!property.bathrooms || property.bathrooms <= 0) newErrors.bathrooms = 'Bathrooms is required';
    if (!property.maxGuests || property.maxGuests <= 0) newErrors.maxGuests = 'Maximum guests is required';
    if (eligibilityBlockers.length > 0) newErrors.eligibility = eligibilityBlockers[0];

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
      console.error('Failed to update property:', error);
      setErrors({ form: 'Failed to update property information' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="wizard-step">
      <div className="wizard-step-content">
        <div className="max-w-2xl">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Property and STR Eligibility</h2>
            <p className="text-gray-600">
              Describe the property, how the STR will operate, and whether HOA, condo, or owner-occupancy rules allow this rental use.
            </p>
          </div>

          {errors.form && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">{errors.form}</div>
          )}

          {eligibilityBlockers.length > 0 && (
            <div className="mb-6 overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-sm">
              <div className="border-b border-rose-100 bg-rose-50 px-5 py-4">
                <div className="inline-flex rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-rose-700">
                  Ineligible for online submission
                </div>
                <h3 className="mt-3 text-lg font-semibold text-rose-950">
                  This property cannot proceed to county review in its current state.
                </h3>
                <p className="mt-2 text-sm text-rose-800">
                  The application has triggered one or more governance or authority conflicts that should stop the normal online licensing path.
                </p>
              </div>

              <div className="px-5 py-5 text-sm text-slate-700">
                <div className="font-medium text-slate-900">Blocking issues</div>
                <ul className="mt-3 space-y-2 list-disc pl-5 text-rose-800">
                  {eligibilityBlockers.map((blocker) => (
                    <li key={blocker}>{blocker}</li>
                  ))}
                </ul>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      What Applicant Should Do
                    </div>
                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                      <li>Review the property answers below and correct anything entered incorrectly.</li>
                      <li>Obtain written HOA, condo, owner, or landlord permission if the property can become eligible.</li>
                      <li>Do not list or rent the room or home until the county approves the license.</li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      County Handling
                    </div>
                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                      <li>Normal review should pause when governance rules prohibit STR use.</li>
                      <li>The application can be saved for exception or manual review once backend routing is added.</li>
                      <li>No license should be issued while these blockers remain unresolved.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={property.address}
                onChange={(e) => updateProperty({ address: e.target.value })}
                className={`portal-input w-full ${errors.address ? 'border-red-500' : ''}`}
                placeholder="123 Main Street"
              />
              {errors.address && (
                <p className="text-red-500 text-sm mt-1">{errors.address}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={property.city}
                  onChange={(e) => updateProperty({ city: e.target.value })}
                  className={`portal-input w-full ${errors.city ? 'border-red-500' : ''}`}
                  placeholder="Marietta"
                />
                {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  value={property.state}
                  onChange={(e) => updateProperty({ state: e.target.value })}
                  className={`portal-input w-full ${errors.state ? 'border-red-500' : ''}`}
                  placeholder="GA"
                />
                {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                <input
                  type="text"
                  value={property.zipCode}
                  onChange={(e) => updateProperty({ zipCode: e.target.value })}
                  className={`portal-input w-full ${errors.zipCode ? 'border-red-500' : ''}`}
                  placeholder="30060"
                />
                {errors.zipCode && (
                  <p className="text-red-500 text-sm mt-1">{errors.zipCode}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parcel Number (optional)
              </label>
              <input
                type="text"
                value={property.parcelNumber}
                onChange={(e) => updateProperty({ parcelNumber: e.target.value })}
                className="portal-input w-full"
                placeholder="0123456789"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
              <select
                value={property.propertyType}
                onChange={(e) => updateProperty({ propertyType: e.target.value as PropertyType })}
                className={`portal-input w-full ${errors.propertyType ? 'border-red-500' : ''}`}
              >
                {PROPERTY_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.propertyType && (
                <p className="text-red-500 text-sm mt-1">{errors.propertyType}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">HOA or Condo Governance</label>
              <select
                value={property.governanceType}
                onChange={(e) =>
                  updateProperty({
                    governanceType: e.target.value as GovernanceType,
                    hoaAllowsStr: e.target.value === 'none' ? true : property.hoaAllowsStr,
                  })
                }
                className={`portal-input w-full ${errors.governanceType ? 'border-red-500' : ''}`}
              >
                {GOVERNANCE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.governanceType && (
                <p className="text-red-500 text-sm mt-1">{errors.governanceType}</p>
              )}
            </div>

            {property.governanceType !== '' && property.governanceType !== 'none' && (
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-900">Do the HOA or condo rules permit STR use at this property?</p>
                <div className="mt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => updateProperty({ hoaAllowsStr: true })}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                      property.hoaAllowsStr === true
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => updateProperty({ hoaAllowsStr: false })}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                      property.hoaAllowsStr === false
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    No
                  </button>
                </div>
                {errors.hoaAllowsStr && (
                  <p className="text-red-500 text-sm mt-2">{errors.hoaAllowsStr}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">How will this STR operate?</label>
              <select
                value={property.operationType}
                onChange={(e) => updateProperty({ operationType: e.target.value as OperationType })}
                className={`portal-input w-full ${errors.operationType ? 'border-red-500' : ''}`}
              >
                {OPERATION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.operationType && (
                <p className="text-red-500 text-sm mt-1">{errors.operationType}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-900">Is the owner living at the property?</p>
                <div className="mt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => updateProperty({ ownerOccupied: true })}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                      property.ownerOccupied === true
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => updateProperty({ ownerOccupied: false })}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                      property.ownerOccupied === false
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    No
                  </button>
                </div>
                {errors.ownerOccupied && (
                  <p className="text-red-500 text-sm mt-2">{errors.ownerOccupied}</p>
                )}
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-900">Is this the applicant's primary residence?</p>
                <div className="mt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => updateProperty({ primaryResidence: true })}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                      property.primaryResidence === true
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => updateProperty({ primaryResidence: false })}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                      property.primaryResidence === false
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    No
                  </button>
                </div>
                {errors.primaryResidence && (
                  <p className="text-red-500 text-sm mt-2">{errors.primaryResidence}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total bedrooms in home</label>
                <input
                  type="number"
                  min="1"
                  value={property.totalBedrooms}
                  onChange={(e) => updateProperty({ totalBedrooms: parseInt(e.target.value, 10) || 0 })}
                  className={`portal-input w-full ${errors.totalBedrooms ? 'border-red-500' : ''}`}
                />
                {errors.totalBedrooms && (
                  <p className="text-red-500 text-sm mt-1">{errors.totalBedrooms}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms offered as STR</label>
                <input
                  type="number"
                  min="1"
                  value={property.strBedrooms}
                  onChange={(e) => updateProperty({ strBedrooms: parseInt(e.target.value, 10) || 0 })}
                  className={`portal-input w-full ${errors.strBedrooms ? 'border-red-500' : ''}`}
                />
                {errors.strBedrooms && (
                  <p className="text-red-500 text-sm mt-1">{errors.strBedrooms}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={property.bathrooms}
                  onChange={(e) => updateProperty({ bathrooms: parseFloat(e.target.value) || 0 })}
                  className={`portal-input w-full ${errors.bathrooms ? 'border-red-500' : ''}`}
                />
                {errors.bathrooms && (
                  <p className="text-red-500 text-sm mt-1">{errors.bathrooms}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maximum overnight guests</label>
                <input
                  type="number"
                  min="1"
                  value={property.maxGuests}
                  onChange={(e) => updateProperty({ maxGuests: parseInt(e.target.value, 10) || 0 })}
                  className={`portal-input w-full ${errors.maxGuests ? 'border-red-500' : ''}`}
                />
                {errors.maxGuests && (
                  <p className="text-red-500 text-sm mt-1">{errors.maxGuests}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Planned listing platforms</label>
              <input
                type="text"
                value={property.listingPlatforms}
                onChange={(e) => updateProperty({ listingPlatforms: e.target.value })}
                className="portal-input w-full"
                placeholder="Airbnb, VRBO"
              />
              <p className="text-xs text-gray-500 mt-2">
                Example: Airbnb only, VRBO only, or Airbnb and VRBO.
              </p>
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
                disabled={isSubmitting || eligibilityBlockers.length > 0}
                className="portal-pill px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : eligibilityBlockers.length > 0 ? 'Property ineligible for progression' : 'Continue to responsible contact'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
