import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkItemStatus, WORK_ITEM_STATUS_LABELS } from '../../../core/models/work-item.model';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="badgeClass">
      <span class="badge-dot"></span>
      {{ label }}
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.2rem 0.625rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
      white-space: nowrap;
      border: 1px solid transparent;
    }

    .badge-dot {
      width: 0.375rem;
      height: 0.375rem;
      border-radius: 50%;
      background-color: currentColor;
    }

    .status-todo {
      background-color: #f1f5f9;
      color: #475569;
      border-color: #cbd5e1;
    }

    .status-inprogress {
      background-color: #eff6ff;
      color: #1d4ed8;
      border-color: #bfdbfe;
    }

    .status-inreview {
      background-color: #faf5ff;
      color: #7e22ce;
      border-color: #e9d5ff;
    }

    .status-done {
      background-color: #ecfdf5;
      color: #047857;
      border-color: #a7f3d0;
    }

    .status-blocked {
      background-color: #fff1f2;
      color: #be123c;
      border-color: #fecdd3;
    }
  `]
})
export class StatusBadgeComponent {
  @Input({ required: true }) status!: WorkItemStatus;

  get label(): string {
    return WORK_ITEM_STATUS_LABELS[this.status] ?? 'Unknown';
  }

  get badgeClass(): string {
    switch (this.status) {
      case WorkItemStatus.Todo:
        return 'status-todo';
      case WorkItemStatus.InProgress:
        return 'status-inprogress';
      case WorkItemStatus.InReview:
        return 'status-inreview';
      case WorkItemStatus.Done:
        return 'status-done';
      case WorkItemStatus.Blocked:
        return 'status-blocked';
      default:
        return 'status-todo';
    }
  }
}

