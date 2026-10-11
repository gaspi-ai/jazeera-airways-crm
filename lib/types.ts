export type PipelineStage =
  | 'RFP_RECEIVED'
  | 'CONCEPT_PITCH'
  | 'MEDIA_PLAN_SENT'
  | 'AVIATION_SAFETY_APPROVAL'
  | 'IO_SIGNED'
  | 'IN_PRODUCTION'
  | 'INSTALLED_POP_DELIVERED'
  | 'CLOSED_WON'
  | 'CLOSED_LOST';

export interface StageConfig {
  id: PipelineStage;
  label: string;
  weight: number; // probability for weighted revenue calculation
  color: string;
  badgeBg: string;
  description: string;
}

export const PIPELINE_STAGES: StageConfig[] = [
  {
    id: 'RFP_RECEIVED',
    label: 'RFP Received',
    weight: 0.1,
    color: '#64748B',
    badgeBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300',
    description: 'Initial agency brief or client inquiry received',
  },
  {
    id: 'CONCEPT_PITCH',
    label: 'Concept Pitch',
    weight: 0.25,
    color: '#0284C7',
    badgeBg: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-300',
    description: 'Creative mockups & preliminary avails shared',
  },
  {
    id: 'MEDIA_PLAN_SENT',
    label: 'Media Plan Sent',
    weight: 0.5,
    color: '#2563EB',
    badgeBg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300',
    description: 'Itemized rate card proposal submitted for client review',
  },
  {
    id: 'AVIATION_SAFETY_APPROVAL',
    label: 'Aviation Safety Gate',
    weight: 0.7,
    color: '#D97706',
    badgeBg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 animate-pulse',
    description: 'FAR/JAR-25 flammability & T5 scanner optical compliance audit',
  },
  {
    id: 'IO_SIGNED',
    label: 'IO Signed',
    weight: 0.85,
    color: '#059669',
    badgeBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300',
    description: 'Official Insertion Order legally executed with Jazeera Airways',
  },
  {
    id: 'IN_PRODUCTION',
    label: 'In Production',
    weight: 0.95,
    color: '#7C3AED',
    badgeBg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300',
    description: 'Print/vinyl fabrication under 4-week airline lead time',
  },
  {
    id: 'INSTALLED_POP_DELIVERED',
    label: 'Installed & PoP',
    weight: 1.0,
    color: '#0D9488',
    badgeBg: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-300',
    description: 'Installed in cabin / T5 with signed inspection certificate',
  },
  {
    id: 'CLOSED_WON',
    label: 'Closed Won',
    weight: 1.0,
    color: '#16A34A',
    badgeBg: 'bg-green-100 text-green-800 dark:bg-green-950/80 dark:text-green-300 border-green-400 font-semibold',
    description: 'Fully billed and recognized airline revenue',
  },
  {
    id: 'CLOSED_LOST',
    label: 'Closed Lost',
    weight: 0.0,
    color: '#DC2626',
    badgeBg: 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-300',
    description: 'Lost to budget, timing, or safety veto',
  },
];

export interface InventoryAssetWithBookings {
  id: string;
  code: string;
  name: string;
  environment: string; // T5_GROUND | INFLIGHT | DIGITAL_PRINT
  category: string; // DIGITAL_SCREEN | LIGHTBOX | WRAP | SEATBACK | OVERHEAD_BIN | MAGAZINE | BOARDING_PASS | E_TICKET | TROLLEY
  locationDesc: string;
  dimensions: string;
  totalUnits: number;
  isDigitalLoop: boolean;
  loopMaxClients: number;
  baseRate1M: number | null;
  baseRate3M: number | null;
  baseRate6M: number | null;
  baseRate12M: number | null;
  productionLeadWeeks: number;
  status: string;
  technicalSpecs: string | null;
  safetyComplianceReq: string | null;
  imageUrl: string | null;
  bookingSlots: {
    id: string;
    dealId: string;
    startDate: Date | string;
    endDate: Date | string;
    slotIndex: number;
    agreedRateKWD: number;
    productionIncluded: boolean;
    deal?: {
      id: string;
      dealCode: string;
      title: string;
      stage: string;
      company: {
        id: string;
        name: string;
      };
    };
  }[];
}

export interface DealWithRelations {
  id: string;
  dealCode: string;
  title: string;
  companyId: string;
  contactId: string | null;
  grossValueKWD?: number;
  discountType?: 'NONE' | 'PERCENTAGE' | 'FIXED_AMOUNT' | null;
  discountValue?: number;
  discountAmountKWD?: number;
  totalValueKWD: number; // Net Payable Value
  stage: string;
  targetStartDate: Date | string | null;
  targetEndDate: Date | string | null;
  aviationApproval: boolean;
  aviationSafetyNotes: string | null;
  flammabilityCertified: boolean;
  scannerChecked: boolean;
  dgcaPermitNo: string | null;
  cancellationReason?: string | null;
  notes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  company: {
    id: string;
    name: string;
    type: string;
    industry: string;
    contactEmail: string;
    phone: string | null;
    billingAddress: string | null;
    isArchived?: boolean;
  };
  contact: {
    id: string;
    name: string;
    role: string;
    email: string;
    phone: string | null;
  } | null;
  bookingSlots: {
    id: string;
    dealId: string;
    assetId: string;
    startDate: Date | string;
    endDate: Date | string;
    slotIndex: number;
    agreedRateKWD: number;
    productionIncluded: boolean;
    notes: string | null;
    asset: {
      id: string;
      code: string;
      name: string;
      environment: string;
      category: string;
      locationDesc: string;
      dimensions: string;
      isDigitalLoop: boolean;
      loopMaxClients: number;
      totalUnits: number;
      baseRate1M: number | null;
    };
  }[];
  proofOfPerformances: {
    id: string;
    dealId: string;
    assetId: string;
    flightNumberOrLocation: string;
    timestamp: Date | string;
    photoUrls: string;
    certifiedBy: string;
    inspectorRole: string | null;
    complianceStatus: string;
    inspectionNotes: string | null;
    asset: {
      code: string;
      name: string;
    };
  }[];
}

export function formatKWD(amount: number): string {
  return new Intl.NumberFormat('en-KW', {
    style: 'currency',
    currency: 'KWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('KWD', '').trim() + ' KWD';
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'TBD';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'TBD';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export interface CompanyWithRelations {
  id: string;
  name: string;
  type: string;
  industry: string;
  contactEmail: string;
  phone: string | null;
  billingAddress: string | null;
  isArchived: boolean;
  createdAt: Date | string;
  contacts: {
    id: string;
    companyId: string;
    name: string;
    role: string;
    email: string;
    phone: string | null;
  }[];
  deals?: {
    id: string;
    dealCode: string;
    title: string;
    stage: string;
    totalValueKWD: number;
    grossValueKWD?: number;
  }[];
}

export interface SystemSettings {
  agencyCommissionPreset: number;
  defaultDiscountPresets: number[];
  currency: string;
  entityName: string;
  department: string;
  taxRegistration: string;
  minProductionLeadWeeks: number;
  flammabilityStandard: string;
  scannerStandard: string;
  dgcaPermitRequired: boolean;
}

