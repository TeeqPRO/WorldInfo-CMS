import { Injectable, signal } from '@angular/core';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'journalist' | 'admin';
  avatar_url: string | null;
}

export type EditableRole = 'user' | 'journalist';

interface AuthResponse {
  token: string;
  user: AuthUser;
}

interface UserResponse {
  user: AuthUser;
}

interface UsersResponse {
  users: AuthUser[];
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  readonly currentUser = signal<AuthUser | null>(null);

  private readonly apiBase = 'http://localhost:8000/api';
  private readonly tokenKey = 'worldinfo_token';

  async restoreSession(): Promise<AuthUser | null> {
    if (this.currentUser()) {
      return this.currentUser();
    }

    if (!this.token) {
      return null;
    }

    try {
      const response = await this.apiRequest<UserResponse>('/auth/me', { method: 'GET' }, true);
      this.currentUser.set(response.user);
      return response.user;
    } catch {
      this.clearSession();
      return null;
    }
  }

  async login(email: string, password: string): Promise<AuthUser> {
    const response = await this.apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    return this.saveSession(response);
  }

  async register(name: string, email: string, password: string): Promise<AuthUser> {
    const response = await this.apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });

    return this.saveSession(response);
  }

  async logout(): Promise<void> {
    if (this.token) {
      await this.apiRequest('/auth/logout', { method: 'POST' }, true).catch(() => null);
    }

    this.clearSession();
  }

  async updateProfile(name: string, avatar: File | null): Promise<AuthUser> {
    const body = new FormData();
    body.set('name', name);

    if (avatar) {
      body.set('avatar', avatar);
    }

    const response = await this.apiRequest<UserResponse>('/profile', {
      method: 'POST',
      body,
    }, true);

    this.currentUser.set(response.user);
    return response.user;
  }

  async getAdminUsers(): Promise<AuthUser[]> {
    const response = await this.apiRequest<UsersResponse>('/admin/users', { method: 'GET' }, true);
    return response.users;
  }

  async updateUserRole(userId: number, role: EditableRole): Promise<AuthUser> {
    const response = await this.apiRequest<UserResponse>(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }, true);

    return response.user;
  }

  clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    this.currentUser.set(null);
  }

  private get token(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private saveSession(response: AuthResponse): AuthUser {
    if (!response.token || !response.user) {
      throw new Error('Niepoprawna odpowiedz serwera.');
    }

    localStorage.setItem(this.tokenKey, response.token);
    this.currentUser.set(response.user);
    return response.user;
  }

  private async apiRequest<T>(path: string, options: RequestInit = {}, auth = false): Promise<T> {
    const headers = new Headers(options.headers);
    const isFormData = options.body instanceof FormData;

    if (!isFormData && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    if (auth) {
      const token = this.token;
      if (!token) {
        throw new Error('Musisz sie zalogowac.');
      }
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${this.apiBase}${path}`, {
      ...options,
      headers,
    });

    const payload: unknown = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(this.getPayloadMessage(payload));
    }

    return payload as T;
  }

  private getPayloadMessage(payload: unknown): string {
    const body = payload as { message?: string; errors?: Record<string, string[]> };
    const firstErrors = body.errors ? Object.values(body.errors)[0] : null;

    return firstErrors?.[0] || body.message || 'Blad polaczenia z API.';
  }
}
