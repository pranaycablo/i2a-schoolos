/**
 * i2A SchoolOS — Centralized API Client
 * 
 * All frontend ↔ backend communication goes through this module.
 * Handles JWT token management, request/response types, and error propagation.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// ─── Token Management ────────────────────────────────────────────────────────

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
  if (token) {
    sessionStorage.setItem('i2a_auth_token', token);
  } else {
    sessionStorage.removeItem('i2a_auth_token');
  }
}

export function getAuthToken(): string | null {
  if (!authToken) {
    authToken = sessionStorage.getItem('i2a_auth_token');
  }
  return authToken;
}

export function clearAuth(): void {
  authToken = null;
  sessionStorage.removeItem('i2a_auth_token');
  sessionStorage.removeItem('i2a_user');
  sessionStorage.removeItem('i2a_tenant');
}

// ─── API Response Types ──────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  code?: string;
  detail?: string;
  details?: unknown;
  requestId?: string;
}

export interface ApiResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: unknown;
  requestId?: string;
  status: number;
}

// ─── Core Fetch Wrapper ──────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResult<T>> {
  const url = `${API_BASE_URL}${path}`;
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return { ok: true, data: undefined as unknown as T, status: 204 };
    }

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      // Handle auth failures globally
      if (response.status === 401) {
        // Token expired or invalid — clear auth state
        clearAuth();
      }

      return {
        ok: false,
        error: body?.error || `Request failed with status ${response.status}`,
        code: body?.code,
        details: body?.details,
        requestId: body?.requestId,
        status: response.status,
      };
    }

    return { ok: true, data: body as T, status: response.status };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error';
    return {
      ok: false,
      error: `Network error: ${message}. Is the API server running?`,
      status: 0,
    };
  }
}

// ─── HTTP Method Helpers ─────────────────────────────────────────────────────

export const api = {
  get: <T>(path: string) => apiFetch<T>(path, { method: 'GET' }),

  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
};

// ─── Auth API ────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
  role?: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    schoolId: string;
    studentId?: string;
    childrenIds?: string[];
    assignedClasses?: string[];
  };
  tenant: {
    id: string;
    name: string;
    [key: string]: unknown;
  };
}

export interface MeResponse {
  success: boolean;
  user: LoginResponse['user'];
  tenant: LoginResponse['tenant'] | null;
}

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', data),

  me: () => api.get<MeResponse>('/auth/me'),

  registerSchool: (data: {
    name: string;
    board: string;
    city: string;
    adminName: string;
    adminEmail: string;
    adminPhone: string;
    planId: string;
    billingCycle: string;
    password?: string;
  }) => api.post<{ success: boolean; tenant: unknown; user: unknown; token: string }>('/auth/register-school', data),

  forgotPassword: (email: string) =>
    api.post<{ success: boolean; message: string; debugOtp?: string }>('/auth/forgot-password', { email }),

  verifyOtp: (email: string, otp: string) =>
    api.post<{ success: boolean; resetToken: string }>('/auth/verify-otp', { email, otp }),

  resetPassword: (email: string, resetToken: string, newPassword: string) =>
    api.post<{ success: boolean; message: string }>('/auth/reset-password', { email, resetToken, newPassword }),

  activateAccount: (data: { invitationToken: string; newPassword: string; email?: string }) =>
    api.post<{ success: boolean; message: string; token: string; user: LoginResponse['user'] }>('/auth/activate-account', data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post<{ success: boolean; message: string }>('/auth/change-password', data),

  inviteUser: (data: {
    email: string;
    name: string;
    role: string;
    schoolId?: string;
    branchId?: string;
    studentId?: string;
    childrenIds?: string[];
    department?: string;
    designation?: string;
    className?: string;
    section?: string;
  }) => api.post<{
    success: boolean;
    message: string;
    userId: string;
    invitationToken: string;
    invitationLink: string;
    invitationExpiresAt: string;
  }>('/auth/invite-user', data),

  resendInvitation: (data: { email?: string; userId?: string }) =>
    api.post<{
      success: boolean;
      message: string;
      invitationToken: string;
      invitationLink: string;
      invitationExpiresAt: string;
    }>('/auth/resend-invitation', data),

  revokeInvitation: (data: { email?: string; userId?: string }) =>
    api.post<{ success: boolean; message: string }>('/auth/revoke-invitation', data),
};

// ─── Students API ────────────────────────────────────────────────────────────

export const studentsApi = {
  list: (schoolId?: string) =>
    api.get<unknown[]>(`/students${schoolId ? `?schoolId=${schoolId}` : ''}`),

  getById: (id: string) => api.get<unknown>(`/students/${id}`),

  create: (data: unknown) => api.post<{ success: boolean; student: unknown }>('/students', data),

  update: (id: string, data: unknown) => api.put<{ success: boolean; student: unknown }>(`/students/${id}`, data),
};

// ─── Admissions API ──────────────────────────────────────────────────────────

export const admissionsApi = {
  list: (schoolId?: string) =>
    api.get<unknown[]>(`/admissions${schoolId ? `?schoolId=${schoolId}` : ''}`),

  submitPublic: (data: unknown) =>
    api.post<{ success: boolean; application: unknown }>('/admissions/public', data),

  updateStatus: (id: string, data: { status: string; testScore?: number; interviewDate?: string; remarks?: string }) =>
    api.put<{ success: boolean }>(`/admissions/${id}/status`, data),

  approve: (id: string) =>
    api.post<{ success: boolean; student: unknown }>(`/admissions/${id}/approve`),
};

// ─── Attendance API ──────────────────────────────────────────────────────────

export const attendanceApi = {
  list: (params: { date?: string; className?: string; section?: string; entityType?: string; schoolId?: string }) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) query.set(k, v); });
    return api.get<unknown[]>(`/attendance?${query.toString()}`);
  },

  mark: (data: { date: string; className?: string; section?: string; attendanceList: unknown[]; entityType?: string }) =>
    api.post<{ success: boolean; message: string }>('/attendance/mark', data),

  lock: (data: { date: string; className?: string; isLocked?: boolean; reason?: string }) =>
    api.post<{ success: boolean; message: string }>('/attendance/lock', data),

  summary: (schoolId?: string) =>
    api.get<unknown>(`/attendance/summary${schoolId ? `?schoolId=${schoolId}` : ''}`),

  leaves: {
    list: (schoolId?: string) =>
      api.get<unknown[]>(`/attendance/leaves${schoolId ? `?schoolId=${schoolId}` : ''}`),

    submit: (data: { leaveType: string; startDate: string; endDate: string; reason: string }) =>
      api.post<{ success: boolean; leave: unknown }>('/attendance/leaves', data),

    updateStatus: (id: string, data: { status: string; remarks?: string }) =>
      api.put<{ success: boolean }>(`/attendance/leaves/${id}/status`, data),
  },
};

// ─── Timetable API ───────────────────────────────────────────────────────────

export const timetableApi = {
  list: (params?: { className?: string; sectionName?: string; schoolId?: string }) => {
    const query = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v) query.set(k, v); });
    return api.get<unknown[]>(`/timetables?${query.toString()}`);
  },

  upsertCell: (data: unknown) =>
    api.post<{ success: boolean; cell: unknown }>('/timetables/cells', data),

  workload: (schoolId?: string) =>
    api.get<unknown[]>(`/timetables/workload${schoolId ? `?schoolId=${schoolId}` : ''}`),
};

// ─── Homework API ────────────────────────────────────────────────────────────

export const homeworkApi = {
  list: (params?: { className?: string; sectionName?: string; schoolId?: string }) => {
    const query = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v) query.set(k, v); });
    return api.get<unknown[]>(`/homework?${query.toString()}`);
  },

  create: (data: unknown) =>
    api.post<{ success: boolean; homework: unknown }>('/homework', data),

  submit: (id: string, data: { textResponse?: string; attachments?: unknown[] }) =>
    api.post<{ success: boolean; submission: unknown }>(`/homework/${id}/submit`, data),

  submissions: (id: string) =>
    api.get<unknown[]>(`/homework/${id}/submissions`),

  grade: (subId: string, data: { awardedMarks: number; teacherFeedback?: string }) =>
    api.post<{ success: boolean; submission: unknown }>(`/homework/submissions/${subId}/grade`, data),
};

// ─── Exam API ────────────────────────────────────────────────────────────────

export const examApi = {
  papers: {
    list: (params?: { className?: string; subject?: string; schoolId?: string }) => {
      const query = new URLSearchParams();
      if (params) Object.entries(params).forEach(([k, v]) => { if (v) query.set(k, v); });
      return api.get<unknown[]>(`/exams/papers?${query.toString()}`);
    },
    create: (data: unknown) =>
      api.post<{ success: boolean; examPaper: unknown }>('/exams/papers', data),
    updateStatus: (id: string, status: string) =>
      api.put<{ success: boolean }>(`/exams/papers/${id}/status`, { status }),
    submit: (id: string, data: { answers: unknown[] }) =>
      api.post<{ success: boolean; submission: unknown }>(`/exams/papers/${id}/submit`, data),
  },
  submissions: (params?: { schoolId?: string }) => {
    const query = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v) query.set(k, v); });
    return api.get<unknown[]>(`/exams/submissions?${query.toString()}`);
  },
};

// ─── Fee API ─────────────────────────────────────────────────────────────────

export const feeApi = {
  types: {
    list: (schoolId?: string) =>
      api.get<unknown[]>(`/fees/types${schoolId ? `?schoolId=${schoolId}` : ''}`),
    create: (data: unknown) =>
      api.post<{ success: boolean; feeType: unknown }>('/fees/types', data),
  },
  receipts: {
    list: (schoolId?: string) =>
      api.get<unknown[]>(`/fees/receipts${schoolId ? `?schoolId=${schoolId}` : ''}`),
    collect: (data: { studentId: string; feeIds: string[]; paymentMode: string; discountAmount?: number; fineAmount?: number; transactionRef?: string; idempotencyKey?: string }) =>
      api.post<{ success: boolean; receipt: any; duplicatePrevented?: boolean; message?: string }>('/fees/receipts/collect', data),
  },
};

// ─── Marketplace API ─────────────────────────────────────────────────────────

export const marketplaceApi = {
  products: {
    list: (schoolId?: string) =>
      api.get<unknown[]>(`/marketplace/products${schoolId ? `?schoolId=${schoolId}` : ''}`),
    create: (data: unknown) =>
      api.post<{ success: boolean; product: unknown }>('/marketplace/products', data),
  },
  orders: {
    list: (schoolId?: string) =>
      api.get<unknown[]>(`/marketplace/orders${schoolId ? `?schoolId=${schoolId}` : ''}`),
    create: (data: unknown) =>
      api.post<{ success: boolean; order: unknown }>('/marketplace/orders', data),
  },
};

// ─── Operations API (Staff, Payroll, Expenses, Transport, Library) ───────────

export const operationsApi = {
  staff: {
    list: (schoolId?: string) =>
      api.get<unknown[]>(`/operations/staff${schoolId ? `?schoolId=${schoolId}` : ''}`),
    create: (data: unknown) =>
      api.post<{ success: boolean; staff: unknown }>('/operations/staff', data),
  },
  payroll: {
    list: (schoolId?: string) =>
      api.get<unknown[]>(`/operations/payroll${schoolId ? `?schoolId=${schoolId}` : ''}`),
    disburse: (recordId: string) =>
      api.post<{ success: boolean; message: string }>('/operations/payroll/disburse', { recordId }),
  },
  expenses: {
    list: (schoolId?: string) =>
      api.get<unknown[]>(`/operations/expenses${schoolId ? `?schoolId=${schoolId}` : ''}`),
    create: (data: unknown) =>
      api.post<{ success: boolean; expense: unknown }>('/operations/expenses', data),
  },
  transport: {
    list: (schoolId?: string) =>
      api.get<unknown[]>(`/operations/transport${schoolId ? `?schoolId=${schoolId}` : ''}`),
    create: (data: unknown) =>
      api.post<{ success: boolean; route: unknown }>('/operations/transport', data),
  },
  library: {
    list: (schoolId?: string) =>
      api.get<unknown[]>(`/operations/library${schoolId ? `?schoolId=${schoolId}` : ''}`),
    create: (data: unknown) =>
      api.post<{ success: boolean; book: unknown }>('/operations/library', data),
  },
};

// ─── Tenants API ─────────────────────────────────────────────────────────────

export const tenantsApi = {
  list: () => api.get<unknown[]>('/tenants'),

  getById: (schoolId: string) =>
    api.get<unknown>(`/tenants/${schoolId}`),

  createTenant: (data: unknown) =>
    api.post<{ success: boolean; tenant: unknown; branch?: unknown; message?: string }>('/tenants', data),

  updateLocation: (schoolId: string, location: unknown) =>
    api.put<{ success: boolean; location: unknown }>(`/tenants/${schoolId}/location`, location),

  updateBranding: (schoolId: string, data: unknown) =>
    api.put<{ success: boolean; branding: unknown }>(`/tenants/${schoolId}/branding`, data),

  submitApplication: (data: unknown) =>
    api.post<{ success: boolean; application: unknown; referenceNumber?: string }>('/tenants/applications', data),

  getStatus: (applicationNo: string, email?: string, trackingToken?: string) => {
    const params = new URLSearchParams();
    if (email) params.set('email', email);
    const qs = params.toString();
    const headers: Record<string, string> = {};
    if (trackingToken) headers['x-tracking-token'] = trackingToken;
    if (email) headers['x-applicant-email'] = email;
    return apiFetch<{ success: boolean; application: unknown }>(
      `/tenants/applications/status/${encodeURIComponent(applicationNo)}${qs ? `?${qs}` : ''}`,
      { method: 'GET', headers }
    );
  },

  rotateTrackingToken: (appId: string, trackingToken?: string) => {
    const headers: Record<string, string> = {};
    if (trackingToken) headers['x-tracking-token'] = trackingToken;
    return apiFetch<{ success: boolean; message: string; trackingToken: string; expiresAt: string }>(
      `/tenants/applications/${encodeURIComponent(appId)}/rotate-tracking-token`,
      { method: 'POST', headers }
    );
  },

  revokeTrackingToken: (appId: string, trackingToken?: string) => {
    const headers: Record<string, string> = {};
    if (trackingToken) headers['x-tracking-token'] = trackingToken;
    return apiFetch<{ success: boolean; message: string }>(
      `/tenants/applications/${encodeURIComponent(appId)}/revoke-tracking-token`,
      { method: 'POST', headers }
    );
  },


  resubmitApplication: (appId: string, data: unknown) =>
    api.put<{ success: boolean; application: unknown }>(`/tenants/applications/${encodeURIComponent(appId)}/resubmit`, data),

  applicationQueue: (params?: { status?: string; category?: string; search?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return api.get<{ success: boolean; applications: unknown[]; pagination?: unknown }>(`/tenants/applications/queue${qs ? `?${qs}` : ''}`);
  },

  getApplication: (appId: string) =>
    api.get<{ success: boolean; application: unknown }>(`/tenants/applications/${encodeURIComponent(appId)}`),

  reviewApplication: (appId: string, notes?: string) =>
    api.post<{ success: boolean; application: unknown }>(`/tenants/applications/${encodeURIComponent(appId)}/review`, { notes }),

  requestCorrection: (appId: string, notes: string) =>
    api.post<{ success: boolean; application: unknown }>(`/tenants/applications/${encodeURIComponent(appId)}/request-correction`, { notes }),

  updateChecklist: (appId: string, checklist: unknown) =>
    api.put<{ success: boolean; verificationChecklist: unknown }>(`/tenants/applications/${encodeURIComponent(appId)}/checklist`, { checklist }),

  rejectApplication: (appId: string, reason: string, reasonCode?: string) =>
    api.post<{ success: boolean; application: unknown }>(`/tenants/applications/${encodeURIComponent(appId)}/reject`, { reason, reasonCode }),

  approveApplication: (appId: string, notes?: string) =>
    api.post<{ success: boolean; message: string; tenant: unknown; user?: unknown; idempotent?: boolean }>(`/tenants/applications/${encodeURIComponent(appId)}/approve`, { notes }),

  cancelApplication: (appId: string, reason?: string) =>
    api.post<{ success: boolean; application: unknown }>(`/tenants/applications/${encodeURIComponent(appId)}/cancel`, { reason }),
};

// ─── Subscription API ────────────────────────────────────────────────────────

export const subscriptionApi = {
  plans: () => api.get<unknown[]>('/subscription/plans'),

  calculatePrice: (data: { planId: string; studentCount: number; durationYears?: number; requestedDiscountPercent?: number }) =>
    api.post<unknown>('/subscription/calculate-price', data),

  trialStatus: (schoolId?: string) =>
    api.get<unknown>(`/subscription/trial-status${schoolId ? `?schoolId=${schoolId}` : ''}`),

  upgrade: (data: { planId: string; billingCycle?: string; durationYears?: number; paymentRef?: string }) =>
    api.post<{ success: boolean; message: string }>('/subscription/upgrade', data),
};

// ─── Payments API ────────────────────────────────────────────────────────────

export const paymentsApi = {
  createOrder: (data: { amountInPaise: number; orderType?: string; referenceId?: string; environment?: string }) =>
    api.post<{ success: boolean; gatewayOrderId: string; keyId: string }>('/payments/create-order', data),

  reconciliations: (schoolId?: string) =>
    api.get<unknown[]>(`/payments/reconciliations${schoolId ? `?schoolId=${schoolId}` : ''}`),
};

// ─── Notifications API ──────────────────────────────────────────────────────

export const notificationsApi = {
  list: (schoolId?: string) =>
    api.get<unknown[]>(`/notifications${schoolId ? `?schoolId=${schoolId}` : ''}`),

  dispatch: (data: unknown) =>
    api.post<{ success: boolean; notification: unknown }>('/notifications/dispatch', data),

  markRead: (id: string) =>
    api.put<{ success: boolean }>(`/notifications/${id}/read`),

  clearRead: () =>
    api.delete<{ success: boolean }>('/notifications/clear'),
};

// ─── Audit Logs API ──────────────────────────────────────────────────────────

export const auditLogsApi = {
  list: (schoolId?: string) =>
    api.get<unknown[]>(`/audit-logs${schoolId ? `?schoolId=${schoolId}` : ''}`),
};

// ─── Health Check (useful for connection indicator) ──────────────────────────

export const healthApi = {
  check: () => api.get<{ status: string; database: string }>('/health'),
};

// ─── Category CMS API ────────────────────────────────────────────────────────

export interface CategoryItem {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  tagline: string;
  description: string;
  icon: string;
  targetAudience: string[];
  keyFeatures: string[];
  workflowHighlights: Array<{ title: string; description: string }>;
  complianceStandards: string[];
  recommendedPlan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export const categoriesApi = {
  list: () =>
    api.get<{ success: boolean; count: number; categories: CategoryItem[] }>('/categories'),

  getBySlug: (slug: string) =>
    api.get<{ success: boolean; category: CategoryItem }>(`/categories/${slug}`),

  adminList: () =>
    api.get<{ success: boolean; count: number; categories: CategoryItem[] }>('/categories/admin/all'),

  create: (data: Partial<CategoryItem>) =>
    api.post<{ success: boolean; category: CategoryItem }>('/categories', data),

  update: (id: string, data: Partial<CategoryItem>) =>
    api.put<{ success: boolean; category: CategoryItem }>(`/categories/${id}`, data),

  archive: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/categories/${id}`),
};

// ─── Public Pricing API ──────────────────────────────────────────────────────

export interface PricingPlanItem {
  id: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  name: string;
  tierName: string;
  subtitle: string;
  baseMonthlyPrice: number;
  baseYearlyPrice: number;
  perStudentYearlyPrice: number;
  perStudentMonthlyPrice: number;
  maxStudents: number;
  maxStaff: number;
  recommendedFor: string;
  highlight: boolean;
  trialDays: number;
  features: string[];
  excludedFeatures: string[];
}

export interface PricingQuoteItem {
  planId: string;
  planName: string;
  students: number;
  durationYears: number;
  billingCycle: 'YEARLY' | 'MONTHLY';
  baseCostPerYear: number;
  studentCostPerYear: number;
  annualSubtotal: number;
  grossTotal: number;
  volumeDiscountPercent: number;
  multiYearDiscountPercent: number;
  totalDiscountPercent: number;
  discountAmount: number;
  netTaxableAmount: number;
  gstRatePercent: number;
  gstAmount: number;
  grandTotalWithGst: number;
  effectiveMonthlyPerStudent: number;
  currency: string;
  currencySymbol: string;
  generatedAt: string;
}

export const pricingApi = {
  getPlans: () =>
    api.get<{ success: boolean; currency: string; currencySymbol: string; gstRatePercent: number; plans: PricingPlanItem[] }>('/pricing/plans'),

  getQuote: (data: { planId: string; studentCount: number; durationYears?: number; billingCycle?: 'YEARLY' | 'MONTHLY' }) =>
    api.post<{ success: boolean; quote: PricingQuoteItem }>('/pricing/quote', data),
};

// ─── Institutional Hierarchy & Academic OS API ───────────────────────────────

export interface BranchItem {
  id: string;
  institutionId: string;
  orgId?: string | null;
  branchCode: string;
  name: string;
  displayName?: string;
  isMainBranch: boolean;
  institutionType?: string;
  boardAffiliation?: string;
  address?: {
    street?: string;
    locality?: string;
    city?: string;
    district?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    latitude?: number | null;
    longitude?: number | null;
    isGeocoded?: boolean;
  };
  contact?: {
    email?: string;
    phone?: string;
    principalName?: string;
  };
  capacity?: number;
  status: 'ACTIVE' | 'ARCHIVED' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
  campuses?: CampusItem[];
  isSyntheticDefault?: boolean;
}

export interface CampusItem {
  id: string;
  branchId: string;
  institutionId: string;
  orgId?: string | null;
  campusCode: string;
  name: string;
  campusType: 'MAIN_CAMPUS' | 'SATELLITE_CAMPUS' | 'SPORTS_COMPLEX' | 'HOSTEL_BLOCK' | 'RESEARCH_CENTRE';
  facilities?: string[];
  capacity?: number;
  address?: {
    street?: string;
    locality?: string;
    city?: string;
    district?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    latitude?: number | null;
    longitude?: number | null;
    isGeocoded?: boolean;
  };
  status: 'ACTIVE' | 'ARCHIVED' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
  isSyntheticDefault?: boolean;
}

export interface AcademicSessionItem {
  id: string;
  institutionId: string;
  sessionName: string;
  startDate: string;
  endDate: string;
  termType: 'ANNUAL' | 'SEMESTER' | 'TRIMESTER';
  category?: string;
  isCurrent: boolean;
  status: 'UPCOMING' | 'ACTIVE' | 'CONCLUDED' | 'ARCHIVED';
  createdAt?: string;
  updatedAt?: string;
}

export interface HierarchyBreadcrumb {
  type: 'ORGANIZATION' | 'INSTITUTION' | 'BRANCH' | 'CAMPUS';
  id: string;
  name: string;
  code?: string;
}

export interface HierarchyTreeResponse {
  success: boolean;
  institution: {
    id: string;
    name: string;
    code: string;
    category: string;
    board: string;
    isStandalone: boolean;
  };
  organization?: {
    id: string;
    name: string;
    orgCode: string;
    orgType: string;
  } | null;
  activeSession?: {
    id: string;
    sessionName: string;
    startDate: string;
    endDate: string;
    termType: string;
    isCurrent: boolean;
  } | null;
  branches: BranchItem[];
  stats: {
    branchCount: number;
    campusCount: number;
    totalCapacity: number;
    hasActiveSession: boolean;
  };
}

export const hierarchyApi = {
  getTree: (institutionId?: string) =>
    api.get<HierarchyTreeResponse>(`/hierarchy/tree${institutionId ? `?institutionId=${institutionId}` : ''}`),

  getBreadcrumbs: (entityType: string, entityId: string) =>
    api.get<{ success: boolean; breadcrumbs: HierarchyBreadcrumb[] }>(`/hierarchy/breadcrumbs?entityType=${entityType}&entityId=${entityId}`),

  // Branches
  listBranches: (params?: { institutionId?: string; orgId?: string; status?: string; includeArchived?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.institutionId) q.append('institutionId', params.institutionId);
    if (params?.orgId) q.append('orgId', params.orgId);
    if (params?.status) q.append('status', params.status);
    if (params?.includeArchived) q.append('includeArchived', 'true');
    const qs = q.toString() ? `?${q.toString()}` : '';
    return api.get<{ success: boolean; branches: BranchItem[] }>(`/hierarchy/branches${qs}`);
  },

  getBranch: (id: string) =>
    api.get<{ success: boolean; branch: BranchItem }>(`/hierarchy/branches/${id}`),

  createBranch: (data: Partial<BranchItem>) =>
    api.post<{ success: boolean; branch: BranchItem }>('/hierarchy/branches', data),

  updateBranch: (id: string, data: Partial<BranchItem>) =>
    api.put<{ success: boolean; branch: BranchItem }>(`/hierarchy/branches/${id}`, data),

  archiveBranch: (id: string) =>
    api.delete<{ success: boolean; branchId: string; archivedCampusesCount: number }>(`/hierarchy/branches/${id}`),

  // Campuses
  listCampuses: (params?: { branchId?: string; institutionId?: string; status?: string; includeArchived?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.branchId) q.append('branchId', params.branchId);
    if (params?.institutionId) q.append('institutionId', params.institutionId);
    if (params?.status) q.append('status', params.status);
    if (params?.includeArchived) q.append('includeArchived', 'true');
    const qs = q.toString() ? `?${q.toString()}` : '';
    return api.get<{ success: boolean; campuses: CampusItem[] }>(`/hierarchy/campuses${qs}`);
  },

  getCampus: (id: string) =>
    api.get<{ success: boolean; campus: CampusItem }>(`/hierarchy/campuses/${id}`),

  createCampus: (data: Partial<CampusItem>) =>
    api.post<{ success: boolean; campus: CampusItem }>('/hierarchy/campuses', data),

  updateCampus: (id: string, data: Partial<CampusItem>) =>
    api.put<{ success: boolean; campus: CampusItem }>(`/hierarchy/campuses/${id}`, data),

  archiveCampus: (id: string) =>
    api.delete<{ success: boolean; campusId: string }>(`/hierarchy/campuses/${id}`),

  // Academic Sessions
  listSessions: (institutionId?: string) => {
    const qs = institutionId ? `?institutionId=${institutionId}` : '';
    return api.get<{ success: boolean; sessions: AcademicSessionItem[] }>(`/hierarchy/academic-sessions${qs}`);
  },

  createSession: (data: Partial<AcademicSessionItem>) =>
    api.post<{ success: boolean; session: AcademicSessionItem }>('/hierarchy/academic-sessions', data),

  updateSession: (id: string, data: Partial<AcademicSessionItem>) =>
    api.put<{ success: boolean; session: AcademicSessionItem }>(`/hierarchy/academic-sessions/${id}`, data),

  activateSession: (id: string, institutionId?: string) =>
    api.post<{ success: boolean; activatedSession: AcademicSessionItem }>(`/hierarchy/academic-sessions/${id}/activate`, { institutionId }),

  archiveSession: (id: string) =>
    api.delete<{ success: boolean; sessionId: string }>(`/hierarchy/academic-sessions/${id}`),

  // Onboarding Bridge
  onboardApplication: (appId: string) =>
    api.post<{ success: boolean; defaultBranchCreated: boolean; defaultCampusCreated: boolean; sessionEnsured: boolean }>(`/hierarchy/onboard-application/${appId}`, {}),
};

// ─── Staff Workforce & Permission Administration API (Phase 10) ───────────────

export const staffApi = {
  listStaff: (params?: { branchId?: string; department?: string; designation?: string; status?: string; isTeacher?: boolean; search?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.branchId) q.append('branchId', params.branchId);
    if (params?.department) q.append('department', params.department);
    if (params?.designation) q.append('designation', params.designation);
    if (params?.status) q.append('status', params.status);
    if (params?.isTeacher !== undefined) q.append('isTeacher', String(params.isTeacher));
    if (params?.search) q.append('search', params.search);
    if (params?.page) q.append('page', String(params.page));
    if (params?.limit) q.append('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return api.get<{ success: boolean; data: any[]; pagination?: any }>(`/staff${qs}`);
  },

  getStaff: (id: string) =>
    api.get<{ success: boolean; data: any }>(`/staff/${id}`),

  createStaff: (data: any) =>
    api.post<{ success: boolean; data: any }>('/staff', data),

  updateStaff: (id: string, data: any) =>
    api.put<{ success: boolean; data: any }>(`/staff/${id}`, data),

  updateStatus: (id: string, status: string, reason?: string) =>
    api.patch<{ success: boolean; data: any }>(`/staff/${id}/status`, { status, reason }),

  assignBranches: (id: string, primaryBranchId?: string, allowedBranchIds?: string[]) =>
    api.post<{ success: boolean; data: any }>(`/staff/${id}/branches`, { primaryBranchId, allowedBranchIds }),

  listLeaves: (params?: { staffId?: string; status?: string; branchId?: string }) => {
    const q = new URLSearchParams();
    if (params?.staffId) q.append('staffId', params.staffId);
    if (params?.status) q.append('status', params.status);
    if (params?.branchId) q.append('branchId', params.branchId);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return api.get<{ success: boolean; data: any[] }>(`/staff/leaves${qs}`);
  },

  applyLeave: (data: { staffId?: string; startDate: string; endDate: string; leaveType?: string; reason?: string }) =>
    api.post<{ success: boolean; data: any }>('/staff/leaves', data),

  processLeaveDecision: (id: string, decision: 'APPROVED' | 'REJECTED', comments?: string) =>
    api.patch<{ success: boolean; data: any }>(`/staff/leaves/${id}/decision`, { decision, comments }),

  validateBulkImport: (rows: any[]) =>
    api.post<{ success: boolean; valid: boolean; totalRows: number; validCount: number; errorCount: number; errors: any[]; cleanRows: any[] }>('/staff/bulk-validate', { rows }),
};


