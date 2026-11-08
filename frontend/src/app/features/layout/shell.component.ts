import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-layout">
      <!-- Mobile header -->
      <header class="mobile-header">
        <button
          type="button"
          class="mobile-menu-btn"
          (click)="toggleMobileMenu()"
          aria-label="Toggle navigation">
          <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" width="22" height="22">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <div class="mobile-brand">
          <span class="brand-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <span class="brand-text">WorkTracker</span>
        </div>
        <button
          type="button"
          class="mobile-logout-btn"
          (click)="onLogout()"
          title="Sign out">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
        </button>
      </header>

      <!-- Mobile drawer backdrop -->
      @if (mobileMenuOpen()) {
        <div class="drawer-backdrop" (click)="closeMobileMenu()"></div>
      }

      <!-- Sidebar -->
      <aside class="sidebar" [class.is-open]="mobileMenuOpen()">
        <div class="sidebar-header">
          <div class="brand">
            <span class="brand-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <div class="brand-details">
              <span class="brand-name">WorkTracker</span>
              <span class="brand-tag">Professional</span>
            </div>
          </div>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-section-title">Workspace</div>
          <a
            routerLink="/dashboard"
            routerLinkActive="active"
            (click)="closeMobileMenu()"
            class="nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            <span>Dashboard</span>
          </a>

          <a
            routerLink="/work-items"
            routerLinkActive="active"
            (click)="closeMobileMenu()"
            class="nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <span>Work Items</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="user-profile">
            <div class="user-avatar">
              {{ avatarInitial() }}
            </div>
            <div class="user-info">
              <span class="user-name" [title]="userFullName()">{{ userFullName() }}</span>
              <span class="user-email" [title]="userEmail()">{{ userEmail() }}</span>
            </div>
          </div>
          <button
            type="button"
            class="btn-logout"
            (click)="onLogout()"
            title="Sign out">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <!-- Main Content Area -->
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
      background-color: #f8fafc;
    }

    /* Mobile header */
    .mobile-header {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 3.5rem;
      background-color: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      z-index: 1000;
      padding: 0 1rem;
      align-items: center;
      justify-content: space-between;
    }

    .mobile-menu-btn, .mobile-logout-btn {
      background: none;
      border: none;
      color: #475569;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem;
      border-radius: 6px;
    }

    .mobile-menu-btn:hover, .mobile-logout-btn:hover {
      background-color: #f1f5f9;
      color: #0f172a;
    }

    .mobile-brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 700;
      color: #0f172a;
      font-size: 1.125rem;
    }

    .drawer-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      background-color: rgba(15, 23, 42, 0.4);
      z-index: 1100;
      backdrop-filter: blur(2px);
    }

    /* Sidebar */
    .sidebar {
      width: 260px;
      background-color: #ffffff;
      border-right: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      position: sticky;
      top: 0;
      height: 100vh;
      z-index: 1200;
      transition: transform 0.25s ease-in-out;
    }

    .sidebar-header {
      padding: 1.5rem 1.25rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .brand-icon {
      width: 38px;
      height: 38px;
      background-color: #eff6ff;
      color: #2563eb;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .brand-details {
      display: flex;
      flex-direction: column;
    }

    .brand-name {
      font-weight: 700;
      font-size: 1rem;
      color: #0f172a;
      letter-spacing: -0.015em;
      line-height: 1.2;
    }

    .brand-tag {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
    }

    .sidebar-nav {
      flex: 1;
      padding: 1.25rem 0.875rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      overflow-y: auto;
    }

    .nav-section-title {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.075em;
      color: #94a3b8;
      padding: 0.5rem 0.75rem;
      margin-bottom: 0.25rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0.75rem;
      border-radius: 8px;
      color: #475569;
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.15s ease-in-out;
    }

    .nav-item:hover {
      background-color: #f8fafc;
      color: #0f172a;
    }

    .nav-item.active {
      background-color: #eff6ff;
      color: #2563eb;
      font-weight: 600;
    }

    .nav-item.active svg {
      color: #2563eb;
    }

    .sidebar-footer {
      padding: 1rem 0.875rem;
      border-top: 1px solid #f1f5f9;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.375rem 0.5rem;
      border-radius: 8px;
    }

    .user-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background-color: #e2e8f0;
      color: #334155;
      font-weight: 600;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .user-name {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-email {
      font-size: 0.6875rem;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .btn-logout {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      width: 100%;
      padding: 0.5rem 0.75rem;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #64748b;
      background: none;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease-in-out;
    }

    .btn-logout:hover {
      background-color: #fef2f2;
      color: #991b1b;
      border-color: #fecaca;
    }

    /* Main Content */
    .main-content {
      flex: 1;
      min-width: 0;
      padding: 2rem;
      overflow-y: auto;
    }

    @media (max-width: 768px) {
      .mobile-header {
        display: flex;
      }

      .drawer-backdrop {
        display: block;
      }

      .sidebar {
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        transform: translateX(-100%);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      }

      .sidebar.is-open {
        transform: translateX(0);
      }

      .main-content {
        padding: 5rem 1rem 2rem 1rem;
      }
    }
  `]
})
export class ShellComponent {
  private readonly authService = inject(AuthService);
  private readonly notification = inject(NotificationService);

  readonly mobileMenuOpen = signal(false);

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  userFullName(): string {
    return this.authService.currentUser()?.fullName ?? 'User';
  }

  userEmail(): string {
    return this.authService.currentUser()?.email ?? '';
  }

  avatarInitial(): string {
    const name = this.userFullName();
    return name.charAt(0).toUpperCase();
  }

  onLogout(): void {
    this.closeMobileMenu();
    this.notification.info('You have been signed out.');
    this.authService.logout('/login');
  }
}

