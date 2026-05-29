// API 服务基地址
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (this.token) {
      requestHeaders['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth APIs
  async login(email: string, password: string) {
    const result = await this.request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    this.setToken(result.token);
    return result;
  }

  async register(email: string, password: string, name?: string) {
    const result = await this.request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: { email, password, name },
    });
    this.setToken(result.token);
    return result;
  }

  async demoLogin() {
    const result = await this.request<{ user: any; token: string }>('/auth/demo', {
      method: 'POST',
    });
    this.setToken(result.token);
    return result;
  }

  async getCurrentUser() {
    return this.request<{ id: string; email: string; name: string }>('/auth/me');
  }

  logout() {
    this.clearToken();
  }

  // Drawing APIs
  async createDrawing(data: {
    name: string;
    filePath: string;
    fileType: string;
    pageCount: number;
    width: number;
    height: number;
    annotations: any[];
  }) {
    return this.request<any>('/drawings', { method: 'POST', body: data });
  }

  async getDrawings() {
    return this.request<any[]>('/drawings');
  }

  async getDrawing(id: string) {
    return this.request<any>(`/drawings/${id}`);
  }

  async updateDrawing(id: string, data: Partial<any>) {
    return this.request<any>(`/drawings/${id}`, { method: 'PUT', body: data });
  }

  async deleteDrawing(id: string) {
    return this.request<{ success: boolean }>(`/drawings/${id}`, { method: 'DELETE' });
  }

  // Form APIs
  async createForm(data: {
    name: string;
    thumbnailUrl?: string;
    ocrResult?: any;
    inspectionData: any[];
    productBatch?: string;
    inspector?: string;
  }) {
    return this.request<any>('/forms', { method: 'POST', body: data });
  }

  async getForms() {
    return this.request<any[]>('/forms');
  }

  async getForm(id: string) {
    return this.request<any>(`/forms/${id}`);
  }

  async updateForm(id: string, data: Partial<any>) {
    return this.request<any>(`/forms/${id}`, { method: 'PUT', body: data });
  }

  async deleteForm(id: string) {
    return this.request<{ success: boolean }>(`/forms/${id}`, { method: 'DELETE' });
  }

  async getFormStats() {
    return this.request<{
      total: number;
      qualifiedCount: number;
      overToleranceCount: number;
      qualifiedRate: number;
    }>('/forms/stats/summary');
  }
}

export const apiService = new ApiService();
