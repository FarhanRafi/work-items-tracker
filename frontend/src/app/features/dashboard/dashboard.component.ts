import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { WorkItemService } from '../../core/services/work-item.service';
import {
  WorkItem,
  WorkItemPriority,
  WorkItemStatus,
  WORK_ITEM_PRIORITY_LABELS,
  WORK_ITEM_STATUS_LABELS
} from '../../core/models/work-item.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../shared/components/priority-badge/priority-badge.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent, PriorityBadgeComponent],
  template: `
    <div class="dashboard-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">Welcome back, {{ authService.currentUser()?.fullName }}. Here is an overview of your work items.</p>
        </div>
        <div class="header-actions">
          <a routerLink="/work-items" [queryParams]="{ new: 'true' }" class="btn btn-primary">
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            <span>Create Item</span>
          </a>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <span>Loading dashboard metrics...</span>
        </div>
      } @else if (errorMessage()) {
        <div class="alert alert-error">
          <span>{{ errorMessage() }}</span>
          <button type="button" class="btn btn-secondary btn-sm" (click)="loadData()">Retry</button>
        </div>
      } @else {
        <!-- Key Metrics Cards -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-icon metric-icon-blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
              </svg>
            </div>
            <div class="metric-info">
              <span class="metric-label">Total Work Items</span>
              <span class="metric-value">{{ totalCount() }}</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon metric-icon-amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="metric-info">
              <span class="metric-label">In Progress</span>
              <span class="metric-value">{{ inProgressCount() }}</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon metric-icon-emerald">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="metric-info">
              <span class="metric-label">Completed</span>
              <span class="metric-value">{{ doneCount() }}</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon metric-icon-rose">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <div class="metric-info">
              <span class="metric-label">Critical / Blocked</span>
              <span class="metric-value">{{ attentionCount() }}</span>
            </div>
          </div>
        </div>

        @if (totalCount() === 0) {
          <!-- Empty State -->
          <div class="empty-dashboard-card">
            <div class="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <h3 class="empty-title">No work items yet</h3>
            <p class="empty-desc">Your tracker is clean and ready. Create your first work item to organize and monitor your tasks.</p>
            <a routerLink="/work-items" [queryParams]="{ new: 'true' }" class="btn btn-primary">
              Create your first item
            </a>
          </div>
        } @else {
          <!-- Charts / Breakdowns Grid -->
          <div class="charts-grid">
            <!-- Status Breakdown -->
            <div class="card">
              <div class="card-header">
                <h2 class="card-title">Status Breakdown</h2>
                <span class="card-badge">{{ completionRate() }}% Done</span>
              </div>
              <div class="breakdown-list">
                @for (item of statusBreakdown(); track item.status) {
                  <div class="breakdown-item">
                    <div class="breakdown-header">
                      <span class="breakdown-label">{{ item.label }}</span>
                      <span class="breakdown-count">{{ item.count }} ({{ item.percent }}%)</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-fill" [style.width.%]="item.percent" [ngClass]="item.cssClass"></div>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Priority Breakdown -->
            <div class="card">
              <div class="card-header">
                <h2 class="card-title">Priority Breakdown</h2>
                <span class="card-badge">{{ attentionCount() }} High/Critical</span>
              </div>
              <div class="breakdown-list">
                @for (item of priorityBreakdown(); track item.priority) {
                  <div class="breakdown-item">
                    <div class="breakdown-header">
                      <span class="breakdown-label">{{ item.label }}</span>
                      <span class="breakdown-count">{{ item.count }} ({{ item.percent }}%)</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-fill" [style.width.%]="item.percent" [ngClass]="item.cssClass"></div>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Recent Work Items -->
          <div class="card recent-items-card">
            <div class="card-header">
              <div>
                <h2 class="card-title">Recent Work Items</h2>
                <p class="card-subtitle">Last 5 active items in your tracker</p>
              </div>
              <a routerLink="/work-items" class="card-link">View all items &rarr;</a>
            </div>

            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Due Date</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of recentItems(); track item.id) {
                    <tr class="clickable-row" (click)="navigateToItem(item.id)">
                      <td class="cell-title">
                        <span class="item-title">{{ item.title }}</span>
                        @if (item.description) {
                          <span class="item-desc-snippet">{{ item.description }}</span>
                        }
                      </td>
                      <td>
                        <app-status-badge [status]="item.status" />
                      </td>
                      <td>
                        <app-priority-badge [priority]="item.priority" />
                      </td>
                      <td class="cell-date">
                        @if (item.dueDateUtc) {
                          {{ item.dueDateUtc | date: 'mediumDate' }}
                        } @else {
                          <span class="text-muted">—</span>
                        }
                      </td>
                      <td class="cell-date text-muted">
                        {{ item.createdAtUtc | date: 'shortDate' }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .dashboard-container {
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .page-title {
      font-size: 1.625rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 0.25rem 0;
      letter-spacing: -0.02em;
    }

    .page-subtitle {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.15s ease-in-out;
    }

    .btn-sm {
      padding: 0.25rem 0.625rem;
      font-size: 0.75rem;
    }

    .btn-primary {
      background-color: #2563eb;
      color: #ffffff;
    }

    .btn-primary:hover {
      background-color: #1d4ed8;
    }

    .btn-secondary {
      background-color: #ffffff;
      border-color: #cbd5e1;
      color: #334155;
    }

    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 4rem 1rem;
      color: #64748b;
      font-size: 0.875rem;
    }

    .spinner {
      width: 22px;
      height: 22px;
      border: 2px solid #e2e8f0;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .alert {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.875rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
    }

    .alert-error {
      background-color: #fef2f2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }

    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 1.25rem;
    }

    .metric-card {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }

    .metric-icon {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .metric-icon-blue {
      background-color: #eff6ff;
      color: #2563eb;
    }

    .metric-icon-amber {
      background-color: #fffbeb;
      color: #d97706;
    }

    .metric-icon-emerald {
      background-color: #ecfdf5;
      color: #059669;
    }

    .metric-icon-rose {
      background-color: #fff1f2;
      color: #e11d48;
    }

    .metric-info {
      display: flex;
      flex-direction: column;
    }

    .metric-label {
      font-size: 0.8125rem;
      font-weight: 500;
      color: #64748b;
    }

    .metric-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.2;
      margin-top: 0.125rem;
    }

    /* Empty state */
    .empty-dashboard-card {
      background-color: #ffffff;
      border: 1px dashed #cbd5e1;
      border-radius: 12px;
      padding: 4rem 2rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .empty-icon {
      color: #94a3b8;
      margin-bottom: 1rem;
    }

    .empty-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #0f172a;
      margin: 0 0 0.5rem 0;
    }

    .empty-desc {
      font-size: 0.875rem;
      color: #64748b;
      max-width: 420px;
      margin: 0 0 1.5rem 0;
      line-height: 1.4;
    }

    /* Charts / Breakdown Cards */
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.25rem;
    }

    .card {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1.25rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
    }

    .card-title {
      font-size: 1rem;
      font-weight: 600;
      color: #0f172a;
      margin: 0;
    }

    .card-subtitle {
      font-size: 0.75rem;
      color: #64748b;
      margin: 0.2rem 0 0 0;
    }

    .card-badge {
      font-size: 0.75rem;
      font-weight: 600;
      color: #0369a1;
      background-color: #f0f9ff;
      border: 1px solid #e0f2fe;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
    }

    .card-link {
      font-size: 0.8125rem;
      font-weight: 500;
      color: #2563eb;
      text-decoration: none;
    }

    .card-link:hover {
      text-decoration: underline;
    }

    .breakdown-list {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }

    .breakdown-item {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .breakdown-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.8125rem;
    }

    .breakdown-label {
      font-weight: 500;
      color: #334155;
    }

    .breakdown-count {
      color: #64748b;
    }

    .progress-bar {
      height: 6px;
      background-color: #f1f5f9;
      border-radius: 9999px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: 9999px;
      transition: width 0.3s ease;
    }

    .progress-todo { background-color: #94a3b8; }
    .progress-inprogress { background-color: #3b82f6; }
    .progress-inreview { background-color: #a855f7; }
    .progress-done { background-color: #10b981; }
    .progress-blocked { background-color: #f43f5e; }

    .progress-low { background-color: #94a3b8; }
    .progress-medium { background-color: #eab308; }
    .progress-high { background-color: #f97316; }
    .progress-critical { background-color: #ef4444; }

    /* Recent Items Table */
    .recent-items-card {
      margin-top: 0.5rem;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.875rem;
    }

    .data-table th {
      padding: 0.75rem 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #e2e8f0;
      background-color: #f8fafc;
    }

    .data-table td {
      padding: 0.875rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }

    .clickable-row {
      cursor: pointer;
      transition: background-color 0.15s ease-in-out;
    }

    .clickable-row:hover {
      background-color: #f8fafc;
    }

    .cell-title {
      max-width: 320px;
    }

    .item-title {
      font-weight: 600;
      color: #0f172a;
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-desc-snippet {
      font-size: 0.75rem;
      color: #64748b;
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 0.125rem;
    }

    .cell-date {
      white-space: nowrap;
      font-size: 0.8125rem;
    }

    .text-muted {
      color: #94a3b8;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private readonly workItemService = inject(WorkItemService);
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);

  readonly items = signal<WorkItem[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly totalCount = computed(() => this.items().length);

  readonly inProgressCount = computed(
    () => this.items().filter((i) => i.status === WorkItemStatus.InProgress).length
  );

  readonly doneCount = computed(
    () => this.items().filter((i) => i.status === WorkItemStatus.Done).length
  );

  readonly attentionCount = computed(
    () =>
      this.items().filter(
        (i) => i.priority === WorkItemPriority.Critical || i.status === WorkItemStatus.Blocked
      ).length
  );

  readonly completionRate = computed(() => {
    const total = this.totalCount();
    if (total === 0) return 0;
    return Math.round((this.doneCount() / total) * 100);
  });

  readonly statusBreakdown = computed(() => {
    const total = this.totalCount();
    const statuses = [
      { status: WorkItemStatus.Todo, label: WORK_ITEM_STATUS_LABELS[WorkItemStatus.Todo], cssClass: 'progress-todo' },
      { status: WorkItemStatus.InProgress, label: WORK_ITEM_STATUS_LABELS[WorkItemStatus.InProgress], cssClass: 'progress-inprogress' },
      { status: WorkItemStatus.InReview, label: WORK_ITEM_STATUS_LABELS[WorkItemStatus.InReview], cssClass: 'progress-inreview' },
      { status: WorkItemStatus.Done, label: WORK_ITEM_STATUS_LABELS[WorkItemStatus.Done], cssClass: 'progress-done' },
      { status: WorkItemStatus.Blocked, label: WORK_ITEM_STATUS_LABELS[WorkItemStatus.Blocked], cssClass: 'progress-blocked' },
    ];

    return statuses.map((s) => {
      const count = this.items().filter((i) => i.status === s.status).length;
      const percent = total > 0 ? Math.round((count / total) * 100) : 0;
      return { ...s, count, percent };
    });
  });

  readonly priorityBreakdown = computed(() => {
    const total = this.totalCount();
    const priorities = [
      { priority: WorkItemPriority.Low, label: WORK_ITEM_PRIORITY_LABELS[WorkItemPriority.Low], cssClass: 'progress-low' },
      { priority: WorkItemPriority.Medium, label: WORK_ITEM_PRIORITY_LABELS[WorkItemPriority.Medium], cssClass: 'progress-medium' },
      { priority: WorkItemPriority.High, label: WORK_ITEM_PRIORITY_LABELS[WorkItemPriority.High], cssClass: 'progress-high' },
      { priority: WorkItemPriority.Critical, label: WORK_ITEM_PRIORITY_LABELS[WorkItemPriority.Critical], cssClass: 'progress-critical' },
    ];

    return priorities.map((p) => {
      const count = this.items().filter((i) => i.priority === p.priority).length;
      const percent = total > 0 ? Math.round((count / total) * 100) : 0;
      return { ...p, count, percent };
    });
  });

  readonly recentItems = computed(() => {
    return [...this.items()]
      .sort((a, b) => new Date(b.createdAtUtc).getTime() - new Date(a.createdAtUtc).getTime())
      .slice(0, 5);
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.workItemService.getAll().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to load work items.');
      }
    });
  }

  navigateToItem(id: string): void {
    this.router.navigate(['/work-items'], { queryParams: { selected: id } });
  }
}

