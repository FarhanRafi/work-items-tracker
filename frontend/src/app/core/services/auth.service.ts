import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, UserProfile } from '../models/auth.model';

const STORAGE_KEY = 'wit_auth_session';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = environment.apiUrl;

  private readonly sessionSignal = signal<AuthResponse | null>(this.readStoredSession());

  readonly currentUser = computed(() => this.sessionSignal());
  readonly isAuthenticated = computed(() => {
    const session = this.sessionSignal();
    if (!session || !session.token) {
      return false;
    }
    return !this.isTokenExpired(session.token);
  });
  readonly token = computed(() => {
    const session = this.sessionSignal();
    if (!session || this.isTokenExpired(session.token)) {
      return null;
    }
    return session.token;
  });

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/register`, request)
      .pipe(tap((response) => this.setSession(response)));
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/login`, request)
      .pipe(tap((response) => this.setSession(response)));
  }

  getCurrentProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/auth/me`);
  }

  logout(redirectUrl: string = '/login'): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors in restricted contexts
    }
    this.sessionSignal.set(null);
    this.router.navigateByUrl(redirectUrl);
  }

  private setSession(session: AuthResponse): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Storage access could fail in private browsing
    }
    this.sessionSignal.set(session);
  }

  private readStoredSession(): AuthResponse | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        return null;
      }
      const parsed: AuthResponse = JSON.parse(data);
      if (this.isTokenExpired(parsed.token)) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    if (!token) {
      return true;
    }
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return true;
      }
      // Decode base64 payload
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payloadJson = decodeURIComponent(
        atob(payloadBase64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(payloadJson);
      if (!payload.exp) {
        return false;
      }
      // exp is in seconds, convert to milliseconds with 10s leeway
      const expiresAtMs = payload.exp * 1000;
      return Date.now() >= expiresAtMs - 10000;
    } catch {
      return true;
    }
  }
}

