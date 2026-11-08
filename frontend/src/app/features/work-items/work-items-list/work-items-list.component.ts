import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { WorkItemService } from '../../../core/services/work-item.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  CreateWorkItemRequest,
  UpdateWorkItemRequest,
  WorkItem,
  WorkItemPriority,
  WorkItemStatus,
  WORK_ITEM_PRIORITY_LABELS,
  WORK_ITEM_STATUS_LABELS
} from '../../../core/models/work-item.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../../shared/components/priority-badge/priority-badge.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { WorkItemFormModalComponent } from '../work-item-form-modal/work-item-form-modal.component';
import { WorkItemDetailModalComponent } from '../work-item-detail-modal/work-item-detail-modal.component';

type SortOption = 'created_desc' | 'created_asc' | 'due_asc' | 'priority_desc' | 'title_asc';

@Component({
  selector: 'app-work-items-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StatusBadgeComponent,
    PriorityBadgeComponent,
    ConfirmDialogComponent,
    WorkItemFormModalComponent,
    WorkItemDetailModalComponent
  ],
  template: `
    <div class="page-container">
      <!-- Page Header -->
      <header class="page-header">
        <div class="header-titles">
          <h1 class="page-title">Work Items</h1>
          <p class="page-subtitle">Track, organize, and execute your team deliverables</p>
        </div>
        <div class="header-actions">
          <button type="button" class="btn btn-primary" (click)="openCreateModal()">
            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
              <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
            New Work Item
          </button>
        </div>
      </header>

      <!-- Filter & Search Toolbar -->
      <section class="toolbar-card" aria-label="Filters and search">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
            <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
          </svg>
          <input
            type="text"
            class="search-input"
            placeholder="Search by title or description..."
            [ngModel]="searchQuery()"
            (ngModelChange)="onSearchChange($event)" />
          @if (searchQuery()) {
            <button
              type="button"
              class="clear-search-btn"
              (click)="onSearchChange('')"
              aria-label="Clear search">
              &times;
            </button>
          }
        </div>

        <div class="filter-controls">
          <!-- Status Filter -->
          <div class="filter-group">
            <label for="filter-status" class="filter-label">Status</label>
            <select
              id="filter-status"
              class="filter-select"
              [ngModel]="selectedStatusFilter()"
              (ngModelChange)="onStatusFilterChange($event)">
              <option value="ALL">All Statuses</option>
              @for (status of statusOptions; track status.value) {
                <option [value]="status.value">{{ status.label }}</option>
              }
            </select>
          </div>

          <!-- Priority Filter -->
          <div class="filter-group">
            <label for="filter-priority" class="filter-label">Priority</label>
            <select
              id="filter-priority"
              class="filter-select"
              [ngModel]="selectedPriorityFilter()"
              (ngModelChange)="onPriorityFilterChange($event)">
              <option value="ALL">All Priorities</option>
              @for (priority of priorityOptions; track priority.value) {
                <option [value]="priority.value">{{ priority.label }}</option>
              }
            </select>
          </div>

          <!-- Sort -->
          <div class="filter-group">
            <label for="filter-sort" class="filter-label">Sort</label>
            <select
              id="filter-sort"
              class="filter-select"
              [ngModel]="sortBy()"
              (ngModelChange)="sortBy.set($event)">
              <option value="created_desc">Newest First</option>
              <option value="created_asc">Oldest First</option>
              <option value="due_asc">Due Date (Earliest)</option>
              <option value="priority_desc">Priority (Highest)</option>
              <option value="title_asc">Title (A-Z)</option>
            </select>
          </div>

          @if (hasActiveFilters()) {
            <button
              type="button"
              class="btn-link"
              (click)="resetFilters()">
              Reset Filters
            </button>
          }
        </div>
      </section>

      <!-- Main Content Area -->
      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading work items...</p>
        </div>
      } @else if (paginatedItems().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          </div>
          @if (hasActiveFilters()) {
            <h3 class="empty-title">No matching work items</h3>
            <p class="empty-description">Try adjusting your search criteria or clear your active filters.</p>
            <button type="button" class="btn btn-secondary" (click)="resetFilters()">
              Clear Filters
            </button>
          } @else {
            <h3 class="empty-title">No work items yet</h3>
            <p class="empty-description">Create your first work item to track progress across your project.</p>
            <button type="button" class="btn btn-primary" (click)="openCreateModal()">
              Create Work Item
            </button>
          }
        </div>
      } @else {
        <!-- Table container -->
        <div class="table-card">
          <div class="table-responsive">
            <table class="items-table">
              <thead>
                <tr>
                  <th scope="col" class="th-title">Title & Description</th>
                  <th scope="col" class="th-status">Status</th>
                  <th scope="col" class="th-priority">Priority</th>
                  <th scope="col" class="th-due">Due Date</th>
                  <th scope="col" class="th-created">Created</th>
                  <th scope="col" class="th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (item of paginatedItems(); track item.id) {
                  <tr class="item-row" (click)="openDetailModal(item)">
                    <td class="td-title">
                      <div class="item-title-wrapper">
                        <span class="item-title-text">{{ item.title }}</span>
                        @if (item.description) {
                          <span class="item-desc-text">{{ item.description }}</span>
                        }
                      </div>
                    </td>
                    <td class="td-status" (click)="$event.stopPropagation()">
                      <div class="quick-status-wrap">
                        <app-status-badge [status]="item.status" />
                        <select
                          class="quick-status-select"
                          [ngModel]="item.status"
                          (ngModelChange)="onQuickStatusChange(item, $event)"
                          aria-label="Quick update status">
                          @for (status of statusOptions; track status.value) {
                            <option [value]="status.value">{{ status.label }}</option>
                          }
                        </select>
                      </div>
                    </td>
                    <td class="td-priority">
                      <app-priority-badge [priority]="item.priority" />
                    </td>
                    <td class="td-due">
                      @if (item.dueDateUtc) {
                        <span [class.overdue-text]="isOverdue(item)">
                          {{ item.dueDateUtc | date: 'mediumDate' }}
                          @if (isOverdue(item)) {
                            <span class="overdue-dot" title="Overdue">!</span>
                          }
                        </span>
                      } @else {
                        <span class="text-subtle">&mdash;</span>
                      }
                    </td>
                    <td class="td-created text-subtle">
                      {{ item.createdAtUtc | date: 'shortDate' }}
                    </td>
                    <td class="td-actions" (click)="$event.stopPropagation()">
                      <div class="actions-group">
                        <button
                          type="button"
                          class="action-icon-btn"
                          (click)="openDetailModal(item)"
                          title="View Details"
                          aria-label="View Details">
                          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          class="action-icon-btn"
                          (click)="openEditModal(item)"
                          title="Edit Item"
                          aria-label="Edit Item">
                          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          class="action-icon-btn btn-delete"
                          (click)="confirmDeleteItem(item)"
                          title="Delete Item"
                          aria-label="Delete Item">
                          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination Footer -->
          <footer class="pagination-footer">
            <span class="pagination-summary">
              Showing <strong>{{ paginationStart() }}</strong> to <strong>{{ paginationEnd() }}</strong> of <strong>{{ filteredItems().length }}</strong> items
            </span>

            <div class="pagination-nav">
              <button
                type="button"
                class="btn-page"
                [disabled]="currentPage() === 1"
                (click)="prevPage()"
                aria-label="Previous page">
                &larr; Prev
              </button>

              <span class="page-current">Page {{ currentPage() }} of {{ totalPages() }}</span>

              <button
                type="button"
                class="btn-page"
                [disabled]="currentPage() >= totalPages()"
                (click)="nextPage()"
                aria-label="Next page">
                Next &rarr;
              </button>
            </div>
          </footer>
        </div>
      }
    </div>

    <!-- Modals -->
    <app-work-item-form-modal
      [isOpen]="isFormModalOpen()"
      [itemToEdit]="itemEditing()"
      [isBusy]="isSaving()"
      (save)="onSaveItem($event)"
      (close)="closeFormModal()" />

    <app-work-item-detail-modal
      [isOpen]="isDetailModalOpen()"
      [item]="itemDetailing()"
      (edit)="onDetailEdit($event)"
      (delete)="onDetailDelete($event)"
      (close)="closeDetailModal()" />

    <app-confirm-dialog
      [isOpen]="isConfirmDialogOpen()"
      title="Delete Work Item"
      [message]="deleteDialogMessage()"
      confirmText="Delete"
      cancelText="Cancel"
      variant="danger"
      [isBusy]="isDeleting()"
      (confirmed)="onExecuteDelete()"
      (cancelled)="closeConfirmDialog()" />
  `,
  styles: [`
    .page-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .page-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.025em;
      margin: 0;
    }

    .page-subtitle {
      font-size: 0.9375rem;
      color: #64748b;
      margin: 0.25rem 0 0 0;
    }

    .toolbar-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
    }

    .search-box {
      position: relative;
      flex: 1;
      min-width: 240px;
      max-width: 380px;
    }

    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: 0.5625rem 2rem 0.5625rem 2.25rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.875rem;
      background: #f8fafc;
      color: #0f172a;
      box-sizing: border-box;
      transition: background-color 0.15s, border-color 0.15s, box-shadow 0.15s;
    }

    .search-input:focus {
      outline: none;
      background: #ffffff;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }

    .clear-search-btn {
      position: absolute;
      right: 0.5rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      font-size: 1.125rem;
      color: #94a3b8;
      cursor: pointer;
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
    }

    .clear-search-btn:hover {
      color: #0f172a;
    }

    .filter-controls {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.875rem;
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .filter-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #64748b;
    }

    .filter-select {
      padding: 0.5rem 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.875rem;
      background-color: #ffffff;
      color: #1e293b;
      cursor: pointer;
    }

    .filter-select:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .btn-link {
      background: none;
      border: none;
      color: #2563eb;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
    }

    .btn-link:hover {
      text-decoration: underline;
      background: #eff6ff;
    }

    .table-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .items-table th {
      background: #f8fafc;
      padding: 0.875rem 1.25rem;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      border-bottom: 1px solid #e2e8f0;
    }

    .items-table td {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #f1f5f9;
      font-size: 0.875rem;
      vertical-align: middle;
    }

    .item-row {
      cursor: pointer;
      transition: background-color 0.15s;
    }

    .item-row:hover {
      background-color: #f8fafc;
    }

    .item-title-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      max-width: 380px;
    }

    .item-title-text {
      font-weight: 600;
      color: #0f172a;
    }

    .item-desc-text {
      font-size: 0.8125rem;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .quick-status-wrap {
      position: relative;
      display: inline-flex;
      align-items: center;
    }

    .quick-status-select {
      position: absolute;
      inset: 0;
      opacity: 0;
      cursor: pointer;
      width: 100%;
    }

    .overdue-text {
      color: #dc2626;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }

    .overdue-dot {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #dc2626;
      color: #ffffff;
      border-radius: 50%;
      width: 16px;
      height: 16px;
      font-size: 0.6875rem;
      font-weight: 800;
    }

    .text-subtle {
      color: #64748b;
      font-size: 0.8125rem;
    }

    .actions-group {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .action-icon-btn {
      background: none;
      border: none;
      padding: 0.375rem;
      border-radius: 6px;
      color: #64748b;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.15s, color 0.15s;
    }

    .action-icon-btn:hover {
      background: #e2e8f0;
      color: #0f172a;
    }

    .action-icon-btn.btn-delete:hover {
      background: #fee2e2;
      color: #dc2626;
    }

    .pagination-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.875rem 1.25rem;
      border-top: 1px solid #e2e8f0;
      background: #ffffff;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .pagination-summary {
      font-size: 0.8125rem;
      color: #64748b;
    }

    .pagination-nav {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .page-current {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #334155;
    }

    .btn-page {
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
      font-weight: 600;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #ffffff;
      color: #334155;
      cursor: pointer;
      transition: background-color 0.15s;
    }

    .btn-page:hover:not(:disabled) {
      background: #f1f5f9;
    }

    .btn-page:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .loading-state,
    .empty-state {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 3.5rem 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 1rem;
    }

    .empty-icon {
      color: #94a3b8;
    }

    .empty-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .empty-description {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0;
      max-width: 380px;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #e2e8f0;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      padding: 0.625rem 1.125rem;
      border-radius: 8px;
      cursor: pointer;
      border: 1px solid transparent;
      transition: background-color 0.15s, border-color 0.15s;
    }

    .btn-primary {
      background: #2563eb;
      color: #ffffff;
    }

    .btn-primary:hover {
      background: #1d4ed8;
    }

    .btn-secondary {
      background: #ffffff;
      border-color: #cbd5e1;
      color: #334155;
    }

    .btn-secondary:hover {
      background: #f8fafc;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .toolbar-card {
        flex-direction: column;
        align-items: stretch;
      }
      .search-box {
        max-width: none;
      }
      .filter-controls {
        flex-direction: column;
        align-items: stretch;
      }
      .filter-group {
        justify-content: space-between;
      }
    }
  `]
})
export class WorkItemsListComponent implements OnInit {
  private readonly workItemService = inject(WorkItemService);
  private readonly notificationService = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);

  // Raw data from server
  readonly items = signal<WorkItem[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly isSaving = signal<boolean>(false);
  readonly isDeleting = signal<boolean>(false);

  // Filters & Sorting state
  readonly searchQuery = signal<string>('');
  readonly selectedStatusFilter = signal<string>('ALL');
  readonly selectedPriorityFilter = signal<string>('ALL');
  readonly sortBy = signal<SortOption>('created_desc');

  // Pagination state
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(10);

  // Modal states
  readonly isFormModalOpen = signal<boolean>(false);
  readonly itemEditing = signal<WorkItem | null>(null);

  readonly isDetailModalOpen = signal<boolean>(false);
  readonly itemDetailing = signal<WorkItem | null>(null);

  readonly isConfirmDialogOpen = signal<boolean>(false);
  readonly itemToDelete = signal<WorkItem | null>(null);

  readonly statusOptions = [
    { value: WorkItemStatus.Todo, label: WORK_ITEM_STATUS_LABELS[WorkItemStatus.Todo] },
    { value: WorkItemStatus.InProgress, label: WORK_ITEM_STATUS_LABELS[WorkItemStatus.InProgress] },
    { value: WorkItemStatus.InReview, label: WORK_ITEM_STATUS_LABELS[WorkItemStatus.InReview] },
    { value: WorkItemStatus.Done, label: WORK_ITEM_STATUS_LABELS[WorkItemStatus.Done] },
    { value: WorkItemStatus.Blocked, label: WORK_ITEM_STATUS_LABELS[WorkItemStatus.Blocked] }
  ];

  readonly priorityOptions = [
    { value: WorkItemPriority.Low, label: WORK_ITEM_PRIORITY_LABELS[WorkItemPriority.Low] },
    { value: WorkItemPriority.Medium, label: WORK_ITEM_PRIORITY_LABELS[WorkItemPriority.Medium] },
    { value: WorkItemPriority.High, label: WORK_ITEM_PRIORITY_LABELS[WorkItemPriority.High] },
    { value: WorkItemPriority.Critical, label: WORK_ITEM_PRIORITY_LABELS[WorkItemPriority.Critical] }
  ];

  // Computed filtered items
  readonly filteredItems = computed(() => {
    let result = [...this.items()];
    const query = this.searchQuery().trim().toLowerCase();
    const statusVal = this.selectedStatusFilter();
    const priorityVal = this.selectedPriorityFilter();

    if (query) {
      result = result.filter(item =>
        item.title.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query))
      );
    }

    if (statusVal !== 'ALL') {
      const targetStatus = Number(statusVal);
      result = result.filter(item => item.status === targetStatus);
    }

    if (priorityVal !== 'ALL') {
      const targetPriority = Number(priorityVal);
      result = result.filter(item => item.priority === targetPriority);
    }

    // Sort
    const sort = this.sortBy();
    result.sort((a, b) => {
      switch (sort) {
        case 'created_asc':
          return new Date(a.createdAtUtc).getTime() - new Date(b.createdAtUtc).getTime();
        case 'created_desc':
          return new Date(b.createdAtUtc).getTime() - new Date(a.createdAtUtc).getTime();
        case 'due_asc':
          if (!a.dueDateUtc) return 1;
          if (!b.dueDateUtc) return -1;
          return new Date(a.dueDateUtc).getTime() - new Date(b.dueDateUtc).getTime();
        case 'priority_desc':
          return b.priority - a.priority;
        case 'title_asc':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return result;
  });

  // Computed pagination
  readonly totalPages = computed(() => {
    const total = this.filteredItems().length;
    return Math.max(1, Math.ceil(total / this.pageSize()));
  });

  readonly paginatedItems = computed(() => {
    const items = this.filteredItems();
    const start = (this.currentPage() - 1) * this.pageSize();
    return items.slice(start, start + this.pageSize());
  });

  readonly paginationStart = computed(() => {
    if (this.filteredItems().length === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  readonly paginationEnd = computed(() => {
    const end = this.currentPage() * this.pageSize();
    return Math.min(end, this.filteredItems().length);
  });

  readonly hasActiveFilters = computed(() => {
    return this.searchQuery().trim() !== '' ||
           this.selectedStatusFilter() !== 'ALL' ||
           this.selectedPriorityFilter() !== 'ALL';
  });

  readonly deleteDialogMessage = computed(() => {
    const item = this.itemToDelete();
    if (!item) return '';
    return `Are you sure you want to permanently delete "${item.title}"? This action cannot be undone.`;
  });

  ngOnInit(): void {
    this.loadWorkItems();
  }

  loadWorkItems(): void {
    this.isLoading.set(true);
    this.workItemService.getAll().subscribe({
      next: (items: WorkItem[]) => {
        this.items.set(items);
        this.isLoading.set(false);
        this.checkInitialQueryParams();
      },
      error: () => {
        this.isLoading.set(false);
        this.notificationService.error('Failed to load work items. Please refresh the page.');
      }
    });
  }

  private checkInitialQueryParams(): void {
    const params = this.route.snapshot.queryParams;
    if (params['new'] === 'true') {
      this.openCreateModal();
    } else if (params['selected']) {
      const target = this.items().find(i => i.id === params['selected']);
      if (target) {
        this.openDetailModal(target);
      }
    }
  }

  onSearchChange(val: string): void {
    this.searchQuery.set(val);
    this.currentPage.set(1);
  }

  onStatusFilterChange(val: string): void {
    this.selectedStatusFilter.set(val);
    this.currentPage.set(1);
  }

  onPriorityFilterChange(val: string): void {
    this.selectedPriorityFilter.set(val);
    this.currentPage.set(1);
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedStatusFilter.set('ALL');
    this.selectedPriorityFilter.set('ALL');
    this.sortBy.set('created_desc');
    this.currentPage.set(1);
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  isOverdue(item: WorkItem): boolean {
    if (!item.dueDateUtc || item.status === WorkItemStatus.Done) {
      return false;
    }
    return new Date(item.dueDateUtc).getTime() < new Date().setHours(0, 0, 0, 0);
  }

  onQuickStatusChange(item: WorkItem, newStatusRaw: string | number): void {
    const newStatus = Number(newStatusRaw) as WorkItemStatus;
    if (item.status === newStatus) return;

    const req: UpdateWorkItemRequest = {
      title: item.title,
      description: item.description,
      status: newStatus,
      priority: item.priority,
      dueDateUtc: item.dueDateUtc
    };

    this.workItemService.update(item.id, req).subscribe({
      next: (updated: WorkItem) => {
        this.items.update(list => list.map(i => i.id === updated.id ? updated : i));
        this.notificationService.success(`Status updated to ${WORK_ITEM_STATUS_LABELS[newStatus]}`);
      },
      error: () => {
        this.notificationService.error('Failed to update status.');
      }
    });
  }

  // Create & Edit Modal
  openCreateModal(): void {
    this.itemEditing.set(null);
    this.isFormModalOpen.set(true);
  }

  openEditModal(item: WorkItem): void {
    this.itemEditing.set(item);
    this.isFormModalOpen.set(true);
  }

  closeFormModal(): void {
    this.isFormModalOpen.set(false);
    this.itemEditing.set(null);
  }

  onSaveItem(payload: CreateWorkItemRequest | UpdateWorkItemRequest): void {
    this.isSaving.set(true);
    const editing = this.itemEditing();

    if (editing) {
      // Update
      this.workItemService.update(editing.id, payload as UpdateWorkItemRequest).subscribe({
        next: (updated: WorkItem) => {
          this.items.update(list => list.map(i => i.id === updated.id ? updated : i));
          this.isSaving.set(false);
          this.closeFormModal();
          this.notificationService.success('Work item updated successfully.');

          // If detail modal is open for this item, update it
          if (this.itemDetailing()?.id === updated.id) {
            this.itemDetailing.set(updated);
          }
        },
        error: () => {
          this.isSaving.set(false);
          this.notificationService.error('Failed to update work item.');
        }
      });
    } else {
      // Create
      this.workItemService.create(payload as CreateWorkItemRequest).subscribe({
        next: (created: WorkItem) => {
          this.items.update(list => [created, ...list]);
          this.isSaving.set(false);
          this.closeFormModal();
          this.notificationService.success('Work item created successfully.');
        },
        error: () => {
          this.isSaving.set(false);
          this.notificationService.error('Failed to create work item.');
        }
      });
    }
  }

  // Details Modal
  openDetailModal(item: WorkItem): void {
    this.itemDetailing.set(item);
    this.isDetailModalOpen.set(true);
  }

  closeDetailModal(): void {
    this.isDetailModalOpen.set(false);
    this.itemDetailing.set(null);
  }

  onDetailEdit(item: WorkItem): void {
    this.closeDetailModal();
    this.openEditModal(item);
  }

  onDetailDelete(item: WorkItem): void {
    this.closeDetailModal();
    this.confirmDeleteItem(item);
  }

  // Delete flow
  confirmDeleteItem(item: WorkItem): void {
    this.itemToDelete.set(item);
    this.isConfirmDialogOpen.set(true);
  }

  closeConfirmDialog(): void {
    this.isConfirmDialogOpen.set(false);
    this.itemToDelete.set(null);
  }

  onExecuteDelete(): void {
    const item = this.itemToDelete();
    if (!item) return;

    this.isDeleting.set(true);
    this.workItemService.delete(item.id).subscribe({
      next: () => {
        this.items.update(list => list.filter(i => i.id !== item.id));
        this.isDeleting.set(false);
        this.closeConfirmDialog();
        this.notificationService.success('Work item deleted.');

        // Adjust pagination if current page becomes empty
        if (this.currentPage() > this.totalPages()) {
          this.currentPage.set(this.totalPages());
        }
      },
      error: () => {
        this.isDeleting.set(false);
        this.notificationService.error('Failed to delete work item.');
      }
    });
  }
}
