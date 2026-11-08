import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  if (!password || !confirmPassword) {
    return null;
  }
  return password.value === confirmPassword.value ? null : { passwordMismatch: true };
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <div class="brand-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.765z" />
            </svg>
          </div>
          <h1 class="auth-title">Create an account</h1>
          <p class="auth-subtitle">Get started with Work Items Tracker today</p>
        </div>

        @if (errorMessage()) {
          <div class="alert alert-error" role="alert">
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate class="auth-form">
          <div class="form-group">
            <label for="fullName" class="form-label">Full name</label>
            <input
              id="fullName"
              type="text"
              formControlName="fullName"
              placeholder="Alex Morgan"
              autocomplete="name"
              class="form-control"
              [class.is-invalid]="hasError('fullName')" />
            @if (hasError('fullName')) {
              <div class="invalid-feedback">
                @if (form.get('fullName')?.hasError('required')) {
                  Full name is required.
                } @else if (form.get('fullName')?.hasError('maxlength')) {
                  Name cannot exceed 150 characters.
                }
              </div>
            }
          </div>

          <div class="form-group">
            <label for="email" class="form-label">Email address</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              placeholder="you@example.com"
              autocomplete="email"
              class="form-control"
              [class.is-invalid]="hasError('email')" />
            @if (hasError('email')) {
              <div class="invalid-feedback">
                @if (form.get('email')?.hasError('required')) {
                  Email is required.
                } @else if (form.get('email')?.hasError('email')) {
                  Enter a valid email address.
                }
              </div>
            }
          </div>

          <div class="form-group">
            <label for="password" class="form-label">Password</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              placeholder="At least 8 characters"
              autocomplete="new-password"
              class="form-control"
              [class.is-invalid]="hasError('password')" />
            @if (hasError('password')) {
              <div class="invalid-feedback">
                @if (form.get('password')?.hasError('required')) {
                  Password is required.
                } @else if (form.get('password')?.hasError('minlength')) {
                  Password must be at least 8 characters.
                }
              </div>
            }
          </div>

          <div class="form-group">
            <label for="confirmPassword" class="form-label">Confirm password</label>
            <input
              id="confirmPassword"
              type="password"
              formControlName="confirmPassword"
              placeholder="Re-enter password"
              autocomplete="new-password"
              class="form-control"
              [class.is-invalid]="hasConfirmPasswordError()" />
            @if (hasConfirmPasswordError()) {
              <div class="invalid-feedback">
                @if (form.get('confirmPassword')?.hasError('required')) {
                  Please confirm your password.
                } @else if (form.hasError('passwordMismatch')) {
                  Passwords do not match.
                }
              </div>
            }
          </div>

          <button
            type="submit"
            class="btn btn-primary btn-block"
            [disabled]="form.invalid || isBusy()">
            @if (isBusy()) {
              <span class="spinner-small"></span>
              Creating account...
            } @else {
              Create account
            }
          </button>
        </form>

        <div class="auth-footer">
          <p>
            Already have an account?
            <a routerLink="/login" class="auth-link">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f8fafc;
      padding: 1.5rem;
    }

    .auth-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
      width: 100%;
      max-width: 440px;
      padding: 2.25rem;
    }

    .auth-header {
      text-align: center;
      margin-bottom: 1.75rem;
    }

    .brand-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      background-color: #eff6ff;
      color: #2563eb;
      border-radius: 10px;
      margin-bottom: 1rem;
    }

    .auth-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 0.375rem 0;
      letter-spacing: -0.025em;
    }

    .auth-subtitle {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0;
    }

    .alert {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      margin-bottom: 1.25rem;
    }

    .alert-error {
      background-color: #fef2f2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1.125rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .form-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #334155;
    }

    .form-control {
      padding: 0.625rem 0.875rem;
      font-size: 0.875rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background-color: #ffffff;
      color: #0f172a;
      transition: all 0.15s ease-in-out;
      outline: none;
    }

    .form-control:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }

    .form-control.is-invalid {
      border-color: #ef4444;
    }

    .form-control.is-invalid:focus {
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
    }

    .invalid-feedback {
      font-size: 0.75rem;
      color: #dc2626;
      margin-top: 0.125rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      border-radius: 6px;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.15s ease-in-out;
      margin-top: 0.25rem;
    }

    .btn-block {
      width: 100%;
    }

    .btn-primary {
      background-color: #2563eb;
      color: #ffffff;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #1d4ed8;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinner-small {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .auth-footer {
      margin-top: 1.5rem;
      text-align: center;
      font-size: 0.875rem;
      color: #64748b;
    }

    .auth-footer p {
      margin: 0;
    }

    .auth-link {
      color: #2563eb;
      font-weight: 500;
      text-decoration: none;
    }

    .auth-link:hover {
      text-decoration: underline;
    }
  `]
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);

  readonly isBusy = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form: FormGroup = this.fb.group(
    {
      fullName: ['', [Validators.required, Validators.maxLength(150)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: passwordMatchValidator }
  );

  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  hasConfirmPasswordError(): boolean {
    const confirm = this.form.get('confirmPassword');
    if (!confirm || (!confirm.dirty && !confirm.touched)) {
      return false;
    }
    return confirm.invalid || this.form.hasError('passwordMismatch');
  }

  onSubmit(): void {
    if (this.form.invalid || this.isBusy()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isBusy.set(true);
    this.errorMessage.set(null);

    const { fullName, email, password } = this.form.value;

    this.authService.register({ fullName, email, password }).subscribe({
      next: (response) => {
        this.isBusy.set(false);
        this.notification.success(`Account created! Welcome, ${response.fullName}!`);
        this.router.navigateByUrl('/dashboard');
      },
      error: (err) => {
        this.isBusy.set(false);
        if (err.status === 409) {
          this.errorMessage.set('An account with this email address already exists.');
        } else {
          this.errorMessage.set(err.error?.message || 'Registration failed. Please check your inputs.');
        }
      }
    });
  }
}

