import { AfterViewInit, Directive, ElementRef, EventEmitter, HostBinding, HostListener, OnDestroy, Output, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

let nextTitleId = 0;

/**
 * Makes a modal's root behave as a dialog, the same way for every modal: assistive technology hears a dialog named
 * by its title, focus moves to the close button on open and back to the opener on close, Escape and a click on the
 * backdrop ask the modal to close, Tab stays inside, and the page behind doesn't scroll.
 * Expects Bootstrap's modal markup inside the host: a `.modal-title` and a `.btn-close`.
 */
@Directive({
  selector: '[appDialog]',
  standalone: true
})
export class DialogDirective implements AfterViewInit, OnDestroy {
  /** Emitted on Escape and on a backdrop click; the modal closes through the same path as its close button */
  @Output() dialogClose = new EventEmitter<void>();

  @HostBinding('attr.role') readonly role = 'dialog';
  @HostBinding('attr.aria-modal') readonly ariaModal = 'true';
  /** The id given to the modal's title, so the dialog is named by it */
  @HostBinding('attr.aria-labelledby') readonly titleId = `dialog-title-${++nextTitleId}`;

  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** The element that had focus when the dialog opened, to give it back on close */
  private opener: Element | null = null;

  ngAfterViewInit(): void {
    this.opener = this.document.activeElement;
    this.host.nativeElement.querySelector('.modal-title')?.setAttribute('id', this.titleId);
    this.document.body.classList.add('modal-open');
    (this.host.nativeElement.querySelector<HTMLElement>('.btn-close') ?? this.focusable()[0])?.focus();
  }

  ngOnDestroy(): void {
    this.document.body.classList.remove('modal-open');
    this.restoreFocus();
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.dialogClose.emit();
    } else if (event.key === 'Tab') {
      this.cycleFocus(event);
    }
  }

  /**
   * A click on the backdrop, the host itself rather than the dialog inside it, closes the modal
   */
  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    if (event.target === this.host.nativeElement) {
      this.dialogClose.emit();
    }
  }

  /**
   * Keeps Tab inside the dialog: from the last focusable element forward to the first, from the first back to the last
   */
  private cycleFocus(event: KeyboardEvent): void {
    const focusable = this.focusable();
    if (focusable.length === 0) {
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && this.document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && this.document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /**
   * Gives focus back to the opener; when it is gone, to the page's main heading rather than the body.
   * The page that replaced the opener is still rendering when the dialog is destroyed, so its heading is looked up
   * once rendering is done.
   */
  private restoreFocus(): void {
    if (this.opener instanceof HTMLElement && this.opener.isConnected) {
      this.opener.focus();
      return;
    }
    setTimeout(() => {
      const heading = this.document.querySelector<HTMLElement>('h1');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus();
      }
    });
  }

  private focusable(): HTMLElement[] {
    return Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>(FOCUSABLE));
  }
}
