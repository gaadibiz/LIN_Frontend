// API integration layer for backend communication
import { config } from './config';

const API_BASE_URL = config.apiUrl;

interface ApiResponse<T = unknown> {
  success?: boolean;
  message: string;
  data?: T;
  user?: T;
  token?: string;
  profile?: T;
  location?: T;
  applicationId?: string;
  // Partner-specific fields
  partnerType?: 'DSA' | 'BC' | 'AFFILIATE' | 'API_PARTNER';
  link?: string;
  stats?: {
    totalUsers?: number;
    totalApplications?: number;
  };
  partner?: any;
  // Partner registration response fields
  email?: string;
  rawPassword?: string;
}

interface ApiError {
  message: string;
  status?: number;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;  // User token
  private partnerToken: string | null = null;  // Partner token

  constructor(baseURL: string) {
    // Remove trailing slash to prevent double slashes in URLs
    this.baseURL = baseURL.replace(/\/+$/, '');
    this.token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    this.partnerToken = typeof window !== 'undefined' ? localStorage.getItem('partnerAuthToken') : null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    usePartnerToken = false  // NEW: Flag to use partner token instead of user token
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const method = options.method || 'GET';

    // Normalize headers to a plain object for easy modification
    const normalizedHeaders: Record<string, string> = {};

    // Add token if available (use partner token if specified)
    // Dynamically fetch from localStorage to ensure we have the latest token
    const dynamicToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : this.token;
    const dynamicPartnerToken = typeof window !== 'undefined' ? localStorage.getItem('partnerAuthToken') : this.partnerToken;
    const tokenToUse = usePartnerToken ? dynamicPartnerToken : dynamicToken;
    
    if (tokenToUse) {
      normalizedHeaders['Authorization'] = `Bearer ${tokenToUse}`;
    }

    // Merge existing headers
    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          normalizedHeaders[key] = value;
        });
      } else if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, value]) => {
          normalizedHeaders[key] = value;
        });
      } else {
        Object.assign(normalizedHeaders, options.headers);
      }
    }

    // Don't set Content-Type for FormData - browser will set it with boundary
    if (!(options.body instanceof FormData)) {
      normalizedHeaders['Content-Type'] = 'application/json';
    }

    console.log(`🚀 [API Request] ${method} ${url}`);
    console.log(`📋 [API Headers]`, { ...normalizedHeaders, Authorization: normalizedHeaders.Authorization ? 'Bearer ****' : undefined });



    const config: RequestInit = {
      ...options,
      headers: normalizedHeaders,
    };

    try {
      const startTime = Date.now();
      const response = await fetch(url, config);
      const duration = Date.now() - startTime;

      console.log(`✅ [API Response] ${response.status} ${response.statusText} (${duration}ms) for ${method} ${endpoint}`);

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorData: any = null;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } else {
            errorMessage = await response.text() || errorMessage;
          }
        } catch {
          errorMessage = response.statusText || errorMessage;
        }

        console.error(`❌ [API Error] Status ${response.status} at ${endpoint}:`, errorMessage, errorData || '');

        // Redirect to login if JWT is expired
        if (response.status === 401 && errorMessage.toLowerCase().includes('jwt expired')) {
          this.clearToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/login?expired=true';
          }
        }

        throw new Error(errorMessage);
      }

      // Parse JSON response
      let data: ApiResponse<T>;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          data = {
            message: text || 'Request completed successfully',
            success: true
          } as ApiResponse<T>;
        }
      } catch (parseError) {
        console.error(`❌ [API Parse Error] Failed to parse response from ${endpoint}:`, parseError);
        data = {
          message: 'Response received but could not be parsed',
          success: false
        } as ApiResponse<T>;
      }

      return data;
    } catch (error: any) {
      if (error instanceof Error) {
        console.error(`🚨 [API Request Failed] ${method} ${endpoint}:`, error.message);
        throw error;
      }
      console.error(`🚨 [API Request Failed] ${method} ${endpoint}:`, error);
      throw new Error(error.message || 'Network error occurred. Please check your connection.');
    }
  }

  // Auth endpoints
  async requestPhoneOtp(phone: string): Promise<ApiResponse> {
    return this.request<ApiResponse>('/api/auth/phone/request-otp', {
      method: 'POST',
      body: JSON.stringify({ phone: phone.startsWith('+91') ? phone : `+91${phone}` }),
    });
  }

  async verifyPhoneOtp(phone: string, code: string): Promise<ApiResponse> {
    // Check for local attribution data
    let attribution = null;
    if (typeof window !== 'undefined') {
      const storedAttr = localStorage.getItem('lin_attribution');
      if (storedAttr) {
        try {
          attribution = JSON.parse(storedAttr); // { partnerId, timestamp, signature }
        } catch (e) {
          console.error("Failed to parse attribution data", e);
        }
      }
    }

    const response = await this.request<ApiResponse>('/api/auth/phone/verify-otp', {
      method: 'POST',
      body: JSON.stringify({
        phone: phone.startsWith('+91') ? phone : `+91${phone}`,
        code,
        attribution // Send attribution data to backend
      }),
    });

    // Store token for future requests
    if (response.token) {
      this.token = response.token;
      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', response.token);
      }
    }

    return response;
  }

  // Login endpoints
  async loginUser(phone: string): Promise<ApiResponse> {
    return this.request<ApiResponse>('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({
        phone: phone.startsWith('+91') ? phone : `+91${phone}`
      }),
    });
  }

  async loginAdmin(email: string, password: string): Promise<ApiResponse> {
    const response = await this.request<ApiResponse>('/api/users/admin-login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Store token if needed (though usually admin panel manages its own state)
    // But since this is for partner registration flow, we might need it for headers
    if (response.token) {
      this.token = response.token; // Reuse user token slot or separate?
      // Actually for this flow, we might just return the response and let the component handle it.
      // But the middleware expects Bearer token.
      // If we want to use registerPartner (which uses authenticate + superAdmin), we MUST set this token.
      this.token = response.token;
      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', response.token);
      }
    }
    return response;
  }

  async verifyLoginOtp(phone: string, code: string): Promise<ApiResponse> {
    const response = await this.request<ApiResponse>('/api/auth/phone/verify-otp', {
      method: 'POST',
      body: JSON.stringify({
        phone: phone.startsWith('+91') ? phone : `+91${phone}`,
        code
      }),
    });

    // Store token for future requests
    if (response.token) {
      this.token = response.token;
      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', response.token);
      }
    }

    return response;
  }

  async registerUser(userData: {
    name: string;
    dob: string;
    gender: string;
    email: string;
    password: string;
  }): Promise<ApiResponse> {
    // Check for attribution data
    let attribution = null;
    if (typeof window !== 'undefined') {
      const storedAttr = localStorage.getItem('lin_attribution');
      if (storedAttr) {
        try {
          attribution = JSON.parse(storedAttr); // { partnerId, timestamp, signature }
        } catch (e) {
          console.error("Failed to parse attribution data", e);
        }
      }
    }

    return this.request<ApiResponse>('/api/users/register', {
      method: 'POST',
      body: JSON.stringify({
        ...userData,
        attribution // Send attribution data to backend
      }),
    });
  }

  // Profile endpoints
  async getProfile(): Promise<ApiResponse> {
    return this.request<ApiResponse>('/api/users/me', {
      method: 'GET',
    });
  }

  async getCompleteProfile(): Promise<ApiResponse> {
    return this.request<ApiResponse>('/api/users/profile/complete', {
      method: 'GET',
    });
  }

  // KYC endpoints
  async submitKYC(kycData: {
    companyName: string;
    companyAddress: string;
    monthlyIncome: number;
    stability: string;
    currentAddress: string;
    currentAddressType: string;
    permanentAddress: string;
    currentCity?: string;
    currentState?: string;
    currentPostalCode?: string;
    loanAmount: number;
    purpose: string;
    status?: string;
    startDate?: string;
    interestRate?: number;
    termMonths?: number;
    employmentType?: string;
  }): Promise<ApiResponse> {
    return this.request<ApiResponse>('/api/kyc', {
      method: 'POST',
      body: JSON.stringify(kycData),
    });
  }

  async updateEmployment(data: {
    companyName: string;
    companyAddress: string;
    monthlyIncome: number;
    stability: string;
  }): Promise<ApiResponse> {
    return this.request<ApiResponse>('/api/kyc/employment', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateAddress(data: {
    currentAddress: string;
    currentAddressType: string;
    permanentAddress: string;
    city?: string;
    state?: string;
    postalCode?: string;
  }): Promise<ApiResponse> {
    return this.request<ApiResponse>('/api/kyc/address', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Document verification endpoints
  async submitDocuments(formData: FormData): Promise<ApiResponse> {
    return this.request<ApiResponse>('/api/document/submit', {
      method: 'POST',
      body: formData,
    });
  }

  async uploadDocument(type: string, file: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request<ApiResponse>(`/api/document/upload/${type}`, {
      method: 'POST',
      body: formData,
    });
  }

  async getDocumentStatus(): Promise<ApiResponse> {
    return this.request<ApiResponse>('/api/document/status', {
      method: 'GET',
    });
  }

  // Selfie endpoints
  async uploadSelfie(selfieFile: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('selfie', selfieFile);

    return this.request<ApiResponse>('/api/selfie/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async getSelfieStatus(): Promise<ApiResponse> {
    return this.request<ApiResponse>('/api/selfie/status', {
      method: 'GET',
    });
  }

  // Location capture endpoint
  async submitLocation(locationData: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    locality?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    placeName?: string;
  }): Promise<ApiResponse> {
    return this.request<ApiResponse>('/api/users/location', {
      method: 'POST',
      body: JSON.stringify(locationData),
    });
  }

  async getLocation(): Promise<ApiResponse> {
    return this.request<ApiResponse>('/api/users/location', {
      method: 'GET',
    });
  }

  // Loan endpoints
  async applyForLoan(loanData: {
    loanAmount: number;
    purposeOfLoan: string;
    loanType?: string;
  }): Promise<ApiResponse> {
    return this.request<ApiResponse>('/api/loans/apply', {
      method: 'POST',
      body: JSON.stringify(loanData),
    });
  }

  async downloadApplicationPdf(applicationId: number): Promise<void> {
    const url = `${this.baseURL}/api/loans/${applicationId}/pdf`;
    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error('Failed to download PDF');
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `LoanApplication_${applicationId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  }

  // Aadhaar verification endpoints (if implemented in backend)
  async requestAadhaarOtp(aadhaarNumber: string): Promise<ApiResponse> {
    // Note: This endpoint may not exist in backend yet
    return this.request<ApiResponse>('/api/auth/aadhaar/request-otp', {
      method: 'POST',
      body: JSON.stringify({ aadhaarNumber }),
    });
  }

  async verifyAadhaarOtp(aadhaarNumber: string, otp: string): Promise<ApiResponse> {
    return this.request<ApiResponse>('/api/auth/aadhaar/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ aadhaarNumber, otp }),
    });
  }

  // Real-time Aadhaar existence check — lightweight, no DB writes
  async validateAadhaar(aadhaarNumber: string): Promise<ApiResponse> {
    return this.request<ApiResponse>('/api/auth/aadhaar/validate', {
      method: 'POST',
      body: JSON.stringify({ aadhaarNumber }),
    });
  }

  // PAN Verification (if implemented in backend)
  // PAN Verification (Bypass implemented)
  async verifyPan(panNumber: string, panImage?: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('panNumber', panNumber);
    if (panImage) {
      formData.append('panImage', panImage);
    }
    return this.request<ApiResponse>('/api/kyc/verify-pan', {
      method: 'POST',
      body: formData,
    });
  }

  // Utility methods
  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  // ===== PARTNER API METHODS =====

  // Partner Authentication
  async loginPartner(identifier: string, password?: string): Promise<ApiResponse> {
    const response = await this.request<ApiResponse>('/api/partners/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });

    // Store partner token for future requests
    if (response.token) {
      this.partnerToken = response.token;
      if (typeof window !== 'undefined') {
        localStorage.setItem('partnerAuthToken', response.token);
        localStorage.setItem('partnerData', JSON.stringify(response));
      }
    }

    return response;
  }

  async requestPartnerLoginOtp(phone: string): Promise<ApiResponse> {
    return this.request<ApiResponse>('/api/partners/login/request-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async verifyPartnerLoginOtp(phone: string, otp: string): Promise<ApiResponse> {
    const response = await this.request<ApiResponse>('/api/partners/login/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });

    if (response.token) {
      this.partnerToken = response.token;
      if (typeof window !== 'undefined') {
        localStorage.setItem('partnerAuthToken', response.token);
        localStorage.setItem('partnerData', JSON.stringify(response));
      }
    }

    return response;
  }

  async registerPartner(partnerData: {
    name: string;
    email: string;
    phone: string;
    password: string;
    partnerType: 'DSA' | 'BC' | 'AFFILIATE' | 'API_PARTNER';
    gstNumber?: string;
    panNumber?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  }): Promise<ApiResponse> {
    return this.request<ApiResponse>('/api/partners/register', {
      method: 'POST',
      body: JSON.stringify(partnerData),
    });
  }

  // Partner Profile & Dashboard
  async getPartnerProfile(): Promise<ApiResponse> {
    return this.request<ApiResponse>('/api/partners/profile', {
      method: 'GET',
    }, true);  // Use partner token
  }

  async updatePartnerProfile(data: {
    name?: string;
    phone?: string;
    gstNumber?: string;
    panNumber?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  }): Promise<ApiResponse> {
    return this.request<ApiResponse>('/api/partners/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }, true);
  }

  async changePartnerPassword(oldPassword: string, newPassword: string): Promise<ApiResponse> {
    return this.request<ApiResponse>('/api/partners/password', {
      method: 'PUT',
      body: JSON.stringify({ oldPassword, newPassword }),
    }, true);
  }

  async getPartnerDashboard(): Promise<ApiResponse> {
    return this.request<ApiResponse>('/api/partners/dashboard', {
      method: 'GET',
    }, true);
  }

  async getPartnerReferralLink(): Promise<ApiResponse> {
    return this.request<ApiResponse>('/api/partners/link', {
      method: 'GET',
    }, true);
  }


  async forgotPartnerPassword(emailOrPhone: string): Promise<ApiResponse> {
    return this.request<ApiResponse>('/api/partners/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ emailOrPhone }),
    });
  }

  async resetPartnerPassword(phone: string, otp: string, newPassword: string): Promise<ApiResponse> {
    return this.request<ApiResponse>('/api/partners/reset-password', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, newPassword }),
    });
  }

  // Partner Utility Methods
  setPartnerToken(token: string) {
    this.partnerToken = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('partnerAuthToken', token);
    }
  }

  clearPartnerToken() {
    this.partnerToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('partnerAuthToken');
      localStorage.removeItem('partnerData');
    }
  }

  getPartnerToken(): string | null {
    return this.partnerToken;
  }

  async getPartnerEarnings(): Promise<any[]> {
    const response = await this.request<any[]>('/api/partners/earnings', {
      method: 'GET',
    }, true);
    return response.data || [];
  }
}

// Create singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export types
export type { ApiResponse, ApiError };
