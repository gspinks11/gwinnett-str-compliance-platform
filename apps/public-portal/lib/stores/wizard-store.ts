import { create } from 'zustand';

export type WizardStep = 'account' | 'property' | 'local-agent' | 'documents' | 'payment';
export type ApplicantRole = 'owner' | 'tenant' | 'authorized-agent' | 'property-manager' | '';
export type PropertyType = 'single-family' | 'multi-family' | 'townhouse' | 'condo' | '';
export type GovernanceType = 'none' | 'hoa' | 'condo-association' | '';
export type OperationType = 'hosted-room' | 'whole-home' | '';
export type ContactAvailability = '24-7' | 'business-hours' | '';
export type ApplicationStatus = 'draft' | 'ineligible' | 'ready-for-submission' | 'submitted';

export type DocumentUploadKey =
  | 'inspectionReport'
  | 'insuranceProof'
  | 'ownershipProof'
  | 'ownerAuthorizationLetter'
  | 'leasePermissionLetter'
  | 'hoaApprovalLetter'
  | 'primaryResidenceProof';

export interface RequiredDocumentField {
  key: DocumentUploadKey;
  label: string;
  description: string;
  required: boolean;
}

interface PersistedWizardDraft {
  version: 1;
  savedAt: string;
  currentStep: WizardStep;
  submittedAt: string | null;
  applicationNumber: string | null;
  account: WizardState['account'];
  property: WizardState['property'];
  localAgent: WizardState['localAgent'];
  documents: {
    certifiesAccuracy: boolean;
    acknowledgesNoOperationUntilApproval: boolean;
    uploadedKeys: DocumentUploadKey[];
  };
  payment: {
    acknowledgesLicenseDisplay: boolean;
  };
}

const WIZARD_DRAFT_STORAGE_KEY = 'sentinel-str-application-draft-v1';

export interface WizardState {
  currentStep: WizardStep;
  isLoading: boolean;
  isDraftSaving: boolean;
  lastSavedAt: Date | null;
  submittedAt: string | null;
  applicationNumber: string | null;
  draftRestoredAt: Date | null;
  draftHasMissingUploads: boolean;
  account: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    applicantRole: ApplicantRole;
    isPropertyOwner: boolean | null;
    hasOwnerAuthorization: boolean | null;
    operatingEntityName: string;
  };
  property: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    parcelNumber: string;
    propertyType: PropertyType;
    governanceType: GovernanceType;
    hoaAllowsStr: boolean | null;
    operationType: OperationType;
    ownerOccupied: boolean | null;
    primaryResidence: boolean | null;
    totalBedrooms: number;
    strBedrooms: number;
    bathrooms: number;
    maxGuests: number;
    listingPlatforms: string;
  };
  localAgent: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company: string;
    licenseNumber: string;
    sameAsApplicant: boolean;
    contactAvailability: ContactAvailability;
  };
  documents: {
    inspectionReport: File | null;
    insuranceProof: File | null;
    ownershipProof: File | null;
    ownerAuthorizationLetter: File | null;
    leasePermissionLetter: File | null;
    hoaApprovalLetter: File | null;
    primaryResidenceProof: File | null;
    certifiesAccuracy: boolean;
    acknowledgesNoOperationUntilApproval: boolean;
  };
  payment: {
    cardholderName: string;
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    acknowledgesLicenseDisplay: boolean;
  };
  setCurrentStep: (step: WizardStep) => void;
  nextStep: () => boolean;
  previousStep: () => void;
  updateAccount: (data: Partial<WizardState['account']>) => void;
  updateProperty: (data: Partial<WizardState['property']>) => void;
  updateLocalAgent: (data: Partial<WizardState['localAgent']>) => void;
  updateDocuments: (data: Partial<WizardState['documents']>) => void;
  updatePayment: (data: Partial<WizardState['payment']>) => void;
  setApplicationNumber: (applicationNumber: string | null) => void;
  markSubmitted: (submittedAt?: string) => void;
  hydrateDraft: () => void;
  saveDraft: () => Promise<void>;
  submitApplication: () => Promise<void>;
  reset: () => void;
}

type WizardDataState = Pick<
  WizardState,
  | 'currentStep'
  | 'isLoading'
  | 'isDraftSaving'
  | 'lastSavedAt'
  | 'submittedAt'
  | 'applicationNumber'
  | 'draftRestoredAt'
  | 'draftHasMissingUploads'
  | 'account'
  | 'property'
  | 'localAgent'
  | 'documents'
  | 'payment'
>;

const initialState: WizardDataState = {
  currentStep: 'account',
  isLoading: false,
  isDraftSaving: false,
  lastSavedAt: null,
  submittedAt: null,
  applicationNumber: null,
  draftRestoredAt: null,
  draftHasMissingUploads: false,
  account: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    applicantRole: '',
    isPropertyOwner: null,
    hasOwnerAuthorization: null,
    operatingEntityName: '',
  },
  property: {
    address: '',
    city: '',
    state: 'GA',
    zipCode: '',
    parcelNumber: '',
    propertyType: '',
    governanceType: '',
    hoaAllowsStr: null,
    operationType: '',
    ownerOccupied: null,
    primaryResidence: null,
    totalBedrooms: 0,
    strBedrooms: 0,
    bathrooms: 0,
    maxGuests: 0,
    listingPlatforms: 'Airbnb, VRBO',
  },
  localAgent: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    licenseNumber: '',
    sameAsApplicant: false,
    contactAvailability: '',
  },
  documents: {
    inspectionReport: null,
    insuranceProof: null,
    ownershipProof: null,
    ownerAuthorizationLetter: null,
    leasePermissionLetter: null,
    hoaApprovalLetter: null,
    primaryResidenceProof: null,
    certifiesAccuracy: false,
    acknowledgesNoOperationUntilApproval: false,
  },
  payment: {
    cardholderName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    acknowledgesLicenseDisplay: false,
  },
};

const stepOrder: WizardStep[] = ['account', 'property', 'local-agent', 'documents', 'payment'];

const getUploadedDocumentKeys = (documents: WizardState['documents']): DocumentUploadKey[] => {
  const fileKeys: DocumentUploadKey[] = [
    'inspectionReport',
    'insuranceProof',
    'ownershipProof',
    'ownerAuthorizationLetter',
    'leasePermissionLetter',
    'hoaApprovalLetter',
    'primaryResidenceProof',
  ];

  return fileKeys.filter((key) => documents[key] !== null);
};

const buildPersistedDraft = (state: WizardState): PersistedWizardDraft => ({
  version: 1,
  savedAt: new Date().toISOString(),
  currentStep: state.currentStep,
  submittedAt: state.submittedAt,
  applicationNumber: state.applicationNumber,
  account: state.account,
  property: state.property,
  localAgent: state.localAgent,
  documents: {
    certifiesAccuracy: state.documents.certifiesAccuracy,
    acknowledgesNoOperationUntilApproval: state.documents.acknowledgesNoOperationUntilApproval,
    uploadedKeys: getUploadedDocumentKeys(state.documents),
  },
  payment: {
    acknowledgesLicenseDisplay: state.payment.acknowledgesLicenseDisplay,
  },
});

export const getRequiredDocumentFields = (
  state: Pick<WizardState, 'account' | 'property'>
): RequiredDocumentField[] => {
  const fields: RequiredDocumentField[] = [
    {
      key: 'inspectionReport',
      label: 'Safety or inspection report',
      description: 'Most recent inspection or safety report required for county review.',
      required: true,
    },
    {
      key: 'insuranceProof',
      label: 'STR liability insurance',
      description: 'Proof of insurance covering short-term rental activity at this address.',
      required: true,
    },
  ];

  if (state.account.isPropertyOwner) {
    fields.push({
      key: 'ownershipProof',
      label: 'Proof of ownership',
      description: 'Deed, tax record, or other document showing the applicant owns the property.',
      required: true,
    });
  }

  if (
    state.account.isPropertyOwner === false ||
    state.account.applicantRole === 'authorized-agent' ||
    state.account.applicantRole === 'property-manager'
  ) {
    fields.push({
      key: 'ownerAuthorizationLetter',
      label: 'Owner authorization letter',
      description: 'Signed authorization from the owner permitting the STR application and operation.',
      required: true,
    });
  }

  if (state.account.applicantRole === 'tenant') {
    fields.push({
      key: 'leasePermissionLetter',
      label: 'Landlord or lease STR permission',
      description: 'Written landlord or lease permission showing STR use is allowed for the tenant.',
      required: true,
    });
  }

  if (state.property.governanceType === 'hoa' || state.property.governanceType === 'condo-association') {
    fields.push({
      key: 'hoaApprovalLetter',
      label: 'HOA or condo STR approval',
      description: 'Association policy or approval showing STR use is permitted for this property.',
      required: true,
    });
  }

  if (state.property.operationType === 'hosted-room' || state.property.primaryResidence) {
    fields.push({
      key: 'primaryResidenceProof',
      label: 'Primary residence proof',
      description: 'Utility bill, homestead record, or similar proof showing the applicant lives in the home.',
      required: true,
    });
  }

  return fields;
};

export const getEligibilityBlockers = (
  state: Pick<WizardState, 'account' | 'property'>
): string[] => {
  const blockers: string[] = [];

  if (
    (state.property.governanceType === 'hoa' || state.property.governanceType === 'condo-association') &&
    state.property.hoaAllowsStr === false
  ) {
    blockers.push('HOA or condo association rules indicate that short-term rentals are not permitted at this property.');
  }

  if (state.account.isPropertyOwner === false && state.account.hasOwnerAuthorization === false) {
    blockers.push('The applicant does not have owner authorization to operate the short-term rental.');
  }

  return blockers;
};

const validateStep = (step: WizardStep, state: WizardState): boolean => {
  switch (step) {
    case 'account':
      return (
        state.account.firstName.trim() !== '' &&
        state.account.lastName.trim() !== '' &&
        state.account.email.includes('@') &&
        state.account.phone.trim() !== '' &&
        state.account.applicantRole !== '' &&
        state.account.isPropertyOwner !== null &&
        state.account.hasOwnerAuthorization !== null &&
        (state.account.isPropertyOwner || state.account.hasOwnerAuthorization === true)
      );
    case 'property':
      return (
        state.property.address.trim() !== '' &&
        state.property.city.trim() !== '' &&
        state.property.state.trim() !== '' &&
        state.property.zipCode.trim() !== '' &&
        state.property.propertyType !== '' &&
        state.property.governanceType !== '' &&
        (state.property.governanceType === 'none' || state.property.hoaAllowsStr !== null) &&
        getEligibilityBlockers(state).length === 0 &&
        state.property.operationType !== '' &&
        state.property.ownerOccupied !== null &&
        state.property.primaryResidence !== null &&
        state.property.totalBedrooms > 0 &&
        state.property.strBedrooms > 0 &&
        state.property.strBedrooms <= state.property.totalBedrooms &&
        state.property.bathrooms > 0 &&
        state.property.maxGuests > 0
      );
    case 'local-agent':
      return (
        state.localAgent.firstName.trim() !== '' &&
        state.localAgent.lastName.trim() !== '' &&
        state.localAgent.email.includes('@') &&
        state.localAgent.phone.trim() !== '' &&
        state.localAgent.contactAvailability !== ''
      );
    case 'documents': {
      const requiredFields = getRequiredDocumentFields(state);
      const hasRequiredUploads = requiredFields.every((field) => state.documents[field.key] !== null);
      return (
        hasRequiredUploads &&
        state.documents.certifiesAccuracy &&
        state.documents.acknowledgesNoOperationUntilApproval
      );
    }
    case 'payment':
      return (
        state.payment.cardholderName.trim() !== '' &&
        state.payment.cardNumber.replace(/\s/g, '').length >= 13 &&
        state.payment.expiryDate.trim() !== '' &&
        state.payment.cvv.length >= 3 &&
        state.payment.acknowledgesLicenseDisplay
      );
    default:
      return false;
  }
};

const hasReadySubmissionPacket = (state: WizardState): boolean => {
  return (
    validateStep('account', state) &&
    validateStep('property', state) &&
    validateStep('local-agent', state) &&
    validateStep('documents', state)
  );
};

export const getApplicationStatus = (state: WizardState): ApplicationStatus => {
  if (state.submittedAt) {
    return 'submitted';
  }

  if (getEligibilityBlockers(state).length > 0) {
    return 'ineligible';
  }

  if (hasReadySubmissionPacket(state)) {
    return 'ready-for-submission';
  }

  return 'draft';
};

const createApplicationNumber = (): string => {
  const timestamp = Date.now().toString().slice(-6);
  return `GWIN-STR-${timestamp}`;
};

export const useWizardStore = create<WizardState>((set, get) => ({
  ...initialState,

  setCurrentStep: (step) => set({ currentStep: step }),

  nextStep: () => {
    const state = get();
    if (!validateStep(state.currentStep, state)) {
      return false;
    }

    const currentIndex = stepOrder.indexOf(state.currentStep);
    if (currentIndex < stepOrder.length - 1) {
      set({ currentStep: stepOrder[currentIndex + 1] });
    }

    return true;
  },

  previousStep: () => {
    const state = get();
    const currentIndex = stepOrder.indexOf(state.currentStep);
    if (currentIndex > 0) {
      set({ currentStep: stepOrder[currentIndex - 1] });
    }
  },

  updateAccount: (data) => set((state) => ({ account: { ...state.account, ...data } })),
  updateProperty: (data) => set((state) => ({ property: { ...state.property, ...data } })),
  updateLocalAgent: (data) => set((state) => ({ localAgent: { ...state.localAgent, ...data } })),
  updateDocuments: (data) => set((state) => ({ documents: { ...state.documents, ...data } })),
  updatePayment: (data) => set((state) => ({ payment: { ...state.payment, ...data } })),
  setApplicationNumber: (applicationNumber) => set({ applicationNumber }),

  markSubmitted: (submittedAt = new Date().toISOString()) => {
    set({ submittedAt, currentStep: 'payment' });

    if (typeof window !== 'undefined') {
      const payload = buildPersistedDraft(get());
      window.localStorage.setItem(WIZARD_DRAFT_STORAGE_KEY, JSON.stringify(payload));
    }
  },

  hydrateDraft: () => {
    if (typeof window === 'undefined') {
      return;
    }

    const rawDraft = window.localStorage.getItem(WIZARD_DRAFT_STORAGE_KEY);
    if (!rawDraft) {
      return;
    }

    try {
      const parsed = JSON.parse(rawDraft) as PersistedWizardDraft;
      if (parsed.version !== 1) {
        return;
      }

      set({
        ...initialState,
        currentStep: parsed.currentStep,
        lastSavedAt: new Date(parsed.savedAt),
        submittedAt: parsed.submittedAt,
        applicationNumber: parsed.applicationNumber,
        draftRestoredAt: new Date(),
        draftHasMissingUploads: parsed.documents.uploadedKeys.length > 0,
        account: parsed.account,
        property: parsed.property,
        localAgent: parsed.localAgent,
        documents: {
          ...initialState.documents,
          certifiesAccuracy: parsed.documents.certifiesAccuracy,
          acknowledgesNoOperationUntilApproval: parsed.documents.acknowledgesNoOperationUntilApproval,
        },
        payment: {
          ...initialState.payment,
          acknowledgesLicenseDisplay: parsed.payment.acknowledgesLicenseDisplay,
        },
      });
    } catch (error) {
      console.error('Failed to restore saved draft:', error);
    }
  },

  saveDraft: async () => {
    set({ isDraftSaving: true });

    try {
      if (typeof window !== 'undefined') {
        const payload = buildPersistedDraft(get());
        window.localStorage.setItem(WIZARD_DRAFT_STORAGE_KEY, JSON.stringify(payload));
        set({ lastSavedAt: new Date(payload.savedAt), isDraftSaving: false });
        return;
      }

      set({ lastSavedAt: new Date(), isDraftSaving: false });
    } catch (error) {
      console.error('Failed to save draft:', error);
      set({ isDraftSaving: false });
    }
  },

  submitApplication: async () => {
    set({ isLoading: true });

    try {
      const submittedAt = new Date().toISOString();
      const applicationNumber = createApplicationNumber();
      set({ isLoading: false, submittedAt, applicationNumber, currentStep: 'payment' });

      if (typeof window !== 'undefined') {
        const payload = buildPersistedDraft(get());
        window.localStorage.setItem(WIZARD_DRAFT_STORAGE_KEY, JSON.stringify(payload));
      }
    } catch (error) {
      console.error('Failed to submit application:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  reset: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(WIZARD_DRAFT_STORAGE_KEY);
    }
    set(initialState);
  },
}));
