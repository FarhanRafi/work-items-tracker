import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkItem, WorkItemStatus } from '../../../core/models/work-item.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../../shared/components/priority-badge/priority-badge.component';

@Component({
  selector: 'app-work-item-detail-modal',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent, PriorityBadgeComponent],
  template: `
    @if (isOpen && item) {
      <div class="modal-backdrop" (click)="onClose()">
        <div
          class="modal-card"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="'detail-dialog-title'"
          (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="badges-row">
              <app-status-badge [status]="item.status" />
              <app-priority-badge [priority]="item.priority" />
            </div>
            <button
              type="button"
              class="modal-close-btn"
              (click)="onClose()"
              aria-label="Close dialog">
              &times;
            </button>
          </div>

          <div class="modal-body">
            <h2 id="detail-dialog-title" class="item-title">{{ item.title }}</h2>

            <div class="section">
              <h3 class="section-heading">Description</h3>
              @if (item.description) {
                <div class="description-text">{{ item.description }}</div>
              } @else {
                <p class="description-empty">No description provided for this work item.</p>
              }
            </div>

            <div class="meta-grid">
              <div class="meta-item">
                <span class="meta-label">Due Date</span>
                <span class="meta-value" [class.is-overdue]="isOverdue(item)">
                  @if (item.dueDateUtc) {
                    {{ item.dueDateUtc | date: 'mediumDate' }}
                    @if (isOverdue(item)) {
                      <span class="overdue-tag">Overdue</span>
                    }
                  } @else {
                    <span class="text-muted">No due date</span>
                  }
                </span>
              </div>

              <div class="meta-item">
                <span class="meta-label">Created At</span>
                <span class="meta-value">{{ item.createdAtUtc | date: 'medium' }}</span>
              </div>

              <div class="meta-item">
                <span class="meta-label">Last Updated</span>
                <span class="meta-value">
                  @if (item.updatedAtUtc) {
                    {{ item.updatedAtUtc | date: 'medium' }}
                  } @else {
                    <span class="text-muted">Not updated</span>
                  }
                </span>
              </div>

              <div class="meta-item">
                <span class="meta-label">Work Item ID</span>
                <span class="meta-value mono">{{ item.id }}</span>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button
              type="button"
              class="btn btn-danger-outline"
              (click)="onDelete()">
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              Delete
            </button>
            <div class="right-buttons">
              <button
                type="button"
                class="btn btn-secondary"
                (click)="onClose()">
                Close
              </button>
              <button
                type="button"
                class="btn btn-primary"
                (click)="onEdit()">
                <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Edit
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
      animation: fadeIn 0.15s ease-out;
    }

    .modal-card {
      background: #ffffff;
      border-radius: 12px;
      width: 100%;
      max-width: 640px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .badges-row {
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }

    .modal-close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      line-height: 1;
      color: #94a3b8;
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      transition: color 0.15s, background-color 0.15s;
    }

    .modal-close-btn:hover {
      color: #0f172a;
      background: #f1f5f9;
    }

    .modal-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .item-title {
      font-size: 1.375rem;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.35;
      margin: 0;
      word-break: break-word;
    }

    .section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .section-heading {
      font-size: 0.8125rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin: 0;
    }

    .description-text {
      font-size: 0.9375rem;
      line-height: 1.6;
      color: #334155;
      white-space: pre-wrap;
      word-break: break-word;
      background: #f8fafc;
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid #f1f5f9;
    }

    .description-empty {
      font-size: 0.9375rem;
      font-style: italic;
      color: #94a3b8;
      margin: 0;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
      background: #f8fafc;
      border-radius: 8px;
      padding: 1rem 1.25rem;
      border: 1px solid #e2e8f0;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .meta-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #64748b;
    }

    .meta-value {
      font-size: 0.875rem;
      font-weight: 500;
      color: #1e293b;
    }

    .meta-value.mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.8125rem;
      color: #475569;
    }

    .meta-value.is-overdue {
      color: #dc2626;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .overdue-tag {
      font-size: 0.6875rem;
      padding: 0.125rem 0.375rem;
      background: #fee2e2;
      color: #b91c1c;
      border-radius: 4px;
      text-transform: uppercase;
      font-weight: 700;
    }

    .text-muted {
      color: #94a3b8;
    }

    .modal-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      border-bottom-left-radius: 12px;
      border-bottom-right-radius: 12px;
    }

    .right-buttons {
      display: flex;
      gap: 0.75rem;
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

    .btn-secondary {
      background: #ffffff;
      border-color: #cbd5e1;
      color: #334155;
    }

    .btn-secondary:hover {
      background: #f1f5f9;
    }

    .btn-primary {
      background: #2563eb;
      color: #ffffff;
    }

    .btn-primary:hover {
      background: #1d4ed8;
    }

    .btn-danger-outline {
      background: #ffffff;
      border-color: #fca5a5;
      color: #dc2626;
    }

    .btn-danger-outline:hover {
      background: #fee2e2;
      border-color: #ef4444;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes scaleIn {
      from { transform: scale(0.96); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    @media (max-width: 640px) {
      .meta-grid {
        grid-template-columns: 1fr;
      }
      .modal-actions {
        flex-direction: column-reverse;
        gap: 0.75rem;
      }
      .modal-actions button,
      .right-buttons {
        width: 100%;
      }
      .right-buttons {
        justify-content: space-between;
      }
    }
  `]
})
export class WorkItemDetailModalComponent {
  @Input() item: WorkItem | null = null;
  @Input() isOpen = false;

  @Output() edit = new EventEmitter<WorkItem>();
  @Output() delete = new EventEmitter<WorkItem>();
  @Output() close = new EventEmitter<void>();

  isOverdue(item: WorkItem): boolean {
    if (!item.dueDateUtc || item.status === WorkItemStatus.Done) {
      return false;
    }
    return new Date(item.dueDateUtc).getTime() < new Date().setHours(0, 0, 0, 0);
  }

  onClose(): void {
    this.close.emit();
  }

  onEdit(): void {
    if (this.item) {
      this.edit.emit(this.item);
    }
  }

  onDelete(): void {
    if (this.item) {
      this.delete.emit(this.item);
    }
  }
}

