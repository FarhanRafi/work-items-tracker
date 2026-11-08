import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { Component } from '@angular/core';
import { AuthService } from './auth.service';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/auth.model';

@Component({ template: '' })
class DummyLoginComponent {}

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', component: DummyLoginComponent }])
      ]
    });

    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('should be created and initial state unauthenticated', () => {
    expect(service).toBeTruthy();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.token()).toBeNull();
    expect(service.currentUser()).toBeNull();
  });

  it('should send login request and store session on success', () => {
    const mockRequest: LoginRequest = {
      email: 'test@example.com',
      password: 'Password123!'
    };

    const payload = {
      sub: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      exp: Math.floor(Date.now() / 1000) + 3600
    };
    const mockJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify(payload))}.mockSignature`;

    const mockResponse: AuthResponse = {
      token: mockJwt,
      expiresAtUtc: new Date(Date.now() + 3600000).toISOString(),
      userId: 'user-123',
      fullName: 'Test User',
      email: 'test@example.com'
    };

    service.login(mockRequest).subscribe((res) => {
      expect(res.token).toEqual(mockJwt);
      expect(service.isAuthenticated()).toBe(true);
      expect(service.token()).toEqual(mockJwt);
      expect(service.currentUser()?.email).toEqual('test@example.com');
    });

    const req = httpTesting.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should send register request and store session on success', () => {
    const mockRequest: RegisterRequest = {
      fullName: 'Alice Walker',
      email: 'alice@example.com',
      password: 'Password123!'
    };

    const payload = {
      sub: 'user-456',
      email: 'alice@example.com',
      name: 'Alice Walker',
      exp: Math.floor(Date.now() / 1000) + 3600
    };
    const mockJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify(payload))}.mockSignature`;

    const mockResponse: AuthResponse = {
      token: mockJwt,
      expiresAtUtc: new Date(Date.now() + 3600000).toISOString(),
      userId: 'user-456',
      fullName: 'Alice Walker',
      email: 'alice@example.com'
    };

    service.register(mockRequest).subscribe((res) => {
      expect(res.token).toEqual(mockJwt);
      expect(service.isAuthenticated()).toBe(true);
      expect(service.currentUser()?.fullName).toEqual('Alice Walker');
    });

    const req = httpTesting.expectOne('/api/auth/register');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should clear session and navigate to /login on logout', () => {
    const navigateSpy = vi.spyOn(router, 'navigateByUrl');

    // Simulate logged in
    const session: AuthResponse = {
      token: 'sample-token',
      userId: 'user-1',
      email: 'user@example.com',
      fullName: 'User One',
      expiresAtUtc: new Date(Date.now() + 3600000).toISOString()
    };
    localStorage.setItem('wit_auth_session', JSON.stringify(session));

    service.logout();

    expect(localStorage.getItem('wit_auth_session')).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.token()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith('/login');
  });
});
