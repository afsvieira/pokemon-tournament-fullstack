import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output } from '@angular/core';

@Component({
  selector: 'app-error-toast',
  standalone: true,
  templateUrl: './error-toast.component.html'
})
export class ErrorToastComponent implements OnChanges, OnDestroy {
  /** The message to show; the toast is hidden while it is empty */
  @Input() message = '';
  /** Emitted when the toast is closed or hides itself, so the parent can clear the message */
  @Output() dismissed = new EventEmitter<void>();

  private readonly autoHideMs = 5000;
  private hideTimer?: ReturnType<typeof setTimeout>;

  ngOnChanges(): void {
    clearTimeout(this.hideTimer);

    if (this.message) {
      this.hideTimer = setTimeout(() => this.dismissed.emit(), this.autoHideMs);
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.hideTimer);
  }

  /**
   * Closes the toast before it hides itself
   */
  dismiss(): void {
    clearTimeout(this.hideTimer);
    this.dismissed.emit();
  }
}
