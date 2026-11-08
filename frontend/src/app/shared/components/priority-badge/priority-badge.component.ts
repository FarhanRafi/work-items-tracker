import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkItemPriority, WORK_ITEM_PRIORITY_LABELS } from '../../../core/models/work-item.model';

@Component({
  selector: 'app-priority-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="priority-badge" [ngClass]="priorityClass">
      <svg class="priority-icon" viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
        <path d="M3 2v12h2V9h7l-2-3.5L12 2H3z" />
      </svg>
      {{ label }}
    </span>
  `,
  styles: [`
    .priority-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
      white-space: nowrap;
    }

    .priority-icon {
      flex-shrink: 0;
    }

    .priority-low {
      background-color: #f1f5f9;
      color: #64748b;
    }

    .priority-medium {
      background-color: #fefce8;
      color: #a16207;
    }

    .priority-high {
      background-color: #fff7ed;
      color: #c2410c;
    }

    .priority-critical {
      background-color: #fef2f2;
      color: #b91c1c;
      font-weight: 600;
    }
  `]
})
export class PriorityBadgeComponent {
  @Input({ required: true }) priority!: WorkItemPriority;

  get label(): string {
    return WORK_ITEM_PRIORITY_LABELS[this.priority] ?? 'Unknown';
  }

  get priorityClass(): string {
    switch (this.priority) {
      case WorkItemPriority.Low:
        return 'priority-low';
      case WorkItemPriority.Medium:
        return 'priority-medium';
      case WorkItemPriority.High:
        return 'priority-high';
      case WorkItemPriority.Critical:
        return 'priority-critical';
      default:
        return 'priority-low';
    }
  }
}

