import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly toastsSignal = signal<ToastMessage[]>([]);
  readonly toasts = this.toastsSignal.asReadonly();

  success(message: string, durationMs: number = 4000): void {
    this.show(message, 'success', durationMs);
  }

  error(message: string, durationMs: number = 6000): void {
    this.show(message, 'error', durationMs);
  }

  info(message: string, durationMs: number = 4000): void {
    this.show(message, 'info', durationMs);
  }

  dismiss(id: string): void {
    this.toastsSignal.update((list) => list.filter((t) => t.id !== id));
  }

  private show(message: string, type: ToastType, durationMs: number): void {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: ToastMessage = { id, type, message };

    this.toastsSignal.update((list) => [...list, toast]);

    if (durationMs > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, durationMs);
    }
  }
}

