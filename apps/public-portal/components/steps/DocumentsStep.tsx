'use client';

import React, { useState } from 'react';
import {
  DocumentUploadKey,
  getRequiredDocumentFields,
  useWizardStore,
} from '../../lib/stores/wizard-store';
import { Upload, File as FileIcon } from 'lucide-react';

const ACCEPTED_FILE_TYPES = '.pdf,.doc,.docx,.png,.jpg,.jpeg';

export default function DocumentsStep() {
  const { account, property, documents, updateDocuments, nextStep, previousStep } =
    useWizardStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draggedField, setDraggedField] = useState<string | null>(null);
  const requiredFields = getRequiredDocumentFields({ account, property });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    for (const field of requiredFields) {
      if (!documents[field.key]) {
        newErrors[field.key] = `${field.label} is required`;
      }
    }

    if (!documents.certifiesAccuracy) {
      newErrors.certifiesAccuracy = 'You must certify that the submission is accurate';
    }
    if (!documents.acknowledgesNoOperationUntilApproval) {
      newErrors.acknowledgesNoOperationUntilApproval =
        'You must acknowledge that the STR cannot operate until the county approves the license';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileSelect = (key: DocumentUploadKey, file: File | null) => {
    updateDocuments({ [key]: file } as Partial<typeof documents>);
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[key];
      return newErrors;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent, key: DocumentUploadKey) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedField(null);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(key, files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // TODO: Upload documents and update application
      if (nextStep()) {
        // Successfully moved to next step
      }
    } catch (error) {
      console.error('Failed to upload documents:', error);
      setErrors({ form: 'Failed to upload documents' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="wizard-step">
      <div className="wizard-step-content">
        <div className="max-w-2xl">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Documentation and Compliance Attestations</h2>
            <p className="text-gray-600">
              Upload the evidence packet required for this STR scenario. The county review team will use these documents to determine whether the application can be approved.
            </p>
          </div>

          {errors.form && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">{errors.form}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Required documents change based on who is applying, whether the home is owner-occupied,
              and whether HOA or condo restrictions apply.
            </div>

            {requiredFields.map((field) => (
              <div key={field.key}>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {documents[field.key] && (
                    <span className="text-xs text-green-600 font-medium">✓ Uploaded</span>
                  )}
                </div>

                <p className="text-sm text-gray-500 mb-3">{field.description}</p>

                {!documents[field.key] ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragEnter={() => setDraggedField(field.key as string)}
                    onDragLeave={() => setDraggedField(null)}
                    onDrop={(e) => handleDrop(e, field.key)}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      draggedField === field.key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Drag and drop your file here
                    </p>
                    <p className="text-xs text-gray-500 mb-3">or</p>
                    <label className="inline-block">
                      <span className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                        Browse files
                      </span>
                      <input
                        type="file"
                        accept={ACCEPTED_FILE_TYPES}
                        onChange={(e) => handleFileSelect(field.key, e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileIcon className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {documents[field.key]?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {documents[field.key]
                            ? `${(documents[field.key]!.size / 1024 / 1024).toFixed(2)} MB`
                            : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFileSelect(field.key, null)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {errors[field.key] && (
                  <p className="text-red-500 text-sm mt-2">{errors[field.key]}</p>
                )}
              </div>
            ))}

            <div className="rounded-lg border border-gray-200 p-5 space-y-4">
              <h3 className="text-base font-semibold text-gray-900">Applicant attestations</h3>

              <label className="flex items-start gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={documents.certifiesAccuracy}
                  onChange={(e) => updateDocuments({ certifiesAccuracy: e.target.checked })}
                  className="mt-1"
                />
                <span>
                  I certify that the application, documents, and supporting statements are complete and accurate to the best of my knowledge.
                </span>
              </label>
              {errors.certifiesAccuracy && (
                <p className="text-red-500 text-sm">{errors.certifiesAccuracy}</p>
              )}

              <label className="flex items-start gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={documents.acknowledgesNoOperationUntilApproval}
                  onChange={(e) =>
                    updateDocuments({ acknowledgesNoOperationUntilApproval: e.target.checked })
                  }
                  className="mt-1"
                />
                <span>
                  I understand that this room or home must not be rented as a short-term rental until Gwinnett County approves and issues the license.
                </span>
              </label>
              {errors.acknowledgesNoOperationUntilApproval && (
                <p className="text-red-500 text-sm">{errors.acknowledgesNoOperationUntilApproval}</p>
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
                {isSubmitting ? 'Processing...' : 'Continue to fee and submission'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
