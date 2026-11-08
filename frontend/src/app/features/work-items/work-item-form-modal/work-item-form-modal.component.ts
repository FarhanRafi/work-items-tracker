import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CreateWorkItemRequest,
  UpdateWorkItemRequest,
  WorkItem,
  WorkItemPriority,
  WorkItemStatus,
  WORK_ITEM_PRIORITY_LABELS,
  WORK_ITEM_STATUS_LABELS
} from '../../../core/models/work-item.model';

@Component({
  selector: 'app-work-item-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (isOpen) {
      <div class="modal-backdrop" (click)="onBackdropClick($event)">
        <div
          class="modal-card"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="'form-dialog-title'"
          (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2 id="form-dialog-title" class="modal-title">
              {{ isEditMode ? 'Edit Work Item' : 'Create New Work Item' }}
            </h2>
            <button
              type="button"
              class="modal-close-btn"
              (click)="onClose()"
              aria-label="Close dialog"
              [disabled]="isBusy">
              &times;
            </button>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal-form" novalidate>
            <!-- Title -->
            <div class="form-group">
              <label for="item-title" class="form-label">
                Title <span class="required">*</span>
              </label>
              <input
                id="item-title"
                type="text"
                formControlName="title"
                class="form-control"
                [class.is-invalid]="hasError('title')"
                placeholder="e.g. Implement refresh token rotation"
                maxlength="200"
                autofocus />
              @if (hasError('title')) {
                <div class="field-error">
                  @if (form.get('title')?.hasError('required')) {
                    Title is required.
                  } @else if (form.get('title')?.hasError('maxlength')) {
                    Title cannot exceed 200 characters.
                  }
                </div>
              }
            </div>

            <!-- Description -->
            <div class="form-group">
              <label for="item-description" class="form-label">Description</label>
              <textarea
                id="item-description"
                formControlName="description"
                rows="4"
                class="form-control"
                [class.is-invalid]="hasError('description')"
                placeholder="Provide task background, acceptance criteria, or technical details..."
                maxlength="4000"></textarea>
              @if (hasError('description')) {
                <div class="field-error">
                  Description cannot exceed 4000 characters.
                </div>
              }
            </div>

            <!-- Status & Priority Row -->
            <div class="form-row">
              <div class="form-group col">
                <label for="item-status" class="form-label">
                  Status <span class="required">*</span>
                </label>
                <select id="item-status" formControlName="status" class="form-control">
                  @for (status of statuses; track status.value) {
                    <option [value]="status.value">{{ status.label }}</option>
                  }
                </select>
              </div>

              <div class="form-group col">
                <label for="item-priority" class="form-label">
                  Priority <span class="required">*</span>
                </label>
                <select id="item-priority" formControlName="priority" class="form-control">
                  @for (priority of priorities; track priority.value) {
                    <option [value]="priority.value">{{ priority.label }}</option>
                  }
                </select>
              </div>
            </div>

            <!-- Due Date -->
            <div class="form-group">
              <label for="item-due-date" class="form-label">Due Date (Optional)</label>
              <input
                id="item-due-date"
                type="date"
                formControlName="dueDate"
                class="form-control" />
            </div>

            <div class="modal-actions">
              <button
                type="button"
                class="btn btn-secondary"
                (click)="onClose()"
                [disabled]="isBusy">
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                [disabled]="form.invalid || isBusy">
                @if (isBusy) {
                  <span class="spinner-small"></span>
                }
                {{ isEditMode ? 'Save Changes' : 'Create Work Item' }}
              </button>
            </div>
          </form>
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
      max-width: 580px;
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

    .modal-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
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

    .modal-form {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #334155;
    }

    .required {
      color: #dc2626;
    }

    .form-control {
      width: 100%;
      padding: 0.625rem 0.875rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.9375rem;
      font-family: inherit;
      color: #0f172a;
      background-color: #ffffff;
      transition: border-color 0.15s, box-shadow 0.15s;
      box-sizing: border-box;
    }

    .form-control:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }

    .form-control.is-invalid {
      border-color: #ef4444;
      background-color: #fef2f2;
    }

    .field-error {
      font-size: 0.8125rem;
      color: #dc2626;
      margin-top: 0.125rem;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 0.75rem;
      padding-top: 1rem;
      border-top: 1px solid #f1f5f9;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      padding: 0.625rem 1.25rem;
      border-radius: 8px;
      cursor: pointer;
      border: 1px solid transparent;
      transition: background-color 0.15s, border-color 0.15s;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #ffffff;
      border-color: #cbd5e1;
      color: #334155;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #f8fafc;
      border-color: #94a3b8;
    }

    .btn-primary {
      background: #2563eb;
      color: #ffffff;
    }

    .btn-primary:hover:not(:disabled) {
      background: #1d4ed8;
    }

    .spinner-small {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.4);
      border-radius: 50%;
      border-top-color: #ffffff;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
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
      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class WorkItemFormModalComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() isOpen = false;
  @Input() itemToEdit: WorkItem | null = null;
  @Input() isBusy = false;

  @Output() save = new EventEmitter<CreateWorkItemRequest | UpdateWorkItemRequest>();
  @Output() close = new EventEmitter<void>();

  get isEditMode(): boolean {
    return !!this.itemToEdit;
  }

  readonly statuses = [
    { value: WorkItemStatus.Todo, label: WORK_ITEM_STATUS_LABELS[WorkItemStatus.Todo] },
    { value: WorkItemStatus.InProgress, label: WORK_ITEM_STATUS_LABELS[WorkItemStatus.InProgress] },
    { value: WorkItemStatus.InReview, label: WORK_ITEM_STATUS_LABELS[WorkItemStatus.InReview] },
    { value: WorkItemStatus.Done, label: WORK_ITEM_STATUS_LABELS[WorkItemStatus.Done] },
    { value: WorkItemStatus.Blocked, label: WORK_ITEM_STATUS_LABELS[WorkItemStatus.Blocked] }
  ];

  readonly priorities = [
    { value: WorkItemPriority.Low, label: WORK_ITEM_PRIORITY_LABELS[WorkItemPriority.Low] },
    { value: WorkItemPriority.Medium, label: WORK_ITEM_PRIORITY_LABELS[WorkItemPriority.Medium] },
    { value: WorkItemPriority.High, label: WORK_ITEM_PRIORITY_LABELS[WorkItemPriority.High] },
    { value: WorkItemPriority.Critical, label: WORK_ITEM_PRIORITY_LABELS[WorkItemPriority.Critical] }
  ];

  form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(4000)]],
    status: [WorkItemStatus.Todo, [Validators.required]],
    priority: [WorkItemPriority.Medium, [Validators.required]],
    dueDate: ['']
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.resetForm();
    }
  }

  private resetForm(): void {
    if (this.itemToEdit) {
      let formattedDate = '';
      if (this.itemToEdit.dueDateUtc) {
        // format ISO UTC string to YYYY-MM-DD
        formattedDate = this.itemToEdit.dueDateUtc.slice(0, 10);
      }
      this.form.reset({
        title: this.itemToEdit.title,
        description: this.itemToEdit.description || '',
        status: Number(this.itemToEdit.status),
        priority: Number(this.itemToEdit.priority),
        dueDate: formattedDate
      });
    } else {
      this.form.reset({
        title: '',
        description: '',
        status: WorkItemStatus.Todo,
        priority: WorkItemPriority.Medium,
        dueDate: ''
      });
    }
  }

  hasError(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  onBackdropClick(event: MouseEvent): void {
    if (!this.isBusy) {
      this.onClose();
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.value;
    let dueDateUtc: string | null = null;
    if (raw.dueDate && raw.dueDate.trim() !== '') {
      // Create UTC midnight date
      const [year, month, day] = raw.dueDate.split('-').map(Number);
      dueDateUtc = new Date(Date.UTC(year, month - 1, day, 0, 0, 0)).toISOString();
    }

    const payload: CreateWorkItemRequest = {
      title: raw.title.trim(),
      description: raw.description ? raw.description.trim() : null,
      status: Number(raw.status) as WorkItemStatus,
      priority: Number(raw.priority) as WorkItemPriority,
      dueDateUtc
    };

    this.save.emit(payload);
  }
}

