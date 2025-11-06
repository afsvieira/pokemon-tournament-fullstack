import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SortBy, SortDirection, SortOptions } from '../../models/sort-options.model';
import { SortByLabels } from '../../models/sort-labels.model';

@Component({
  selector: 'app-sort-controls',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './sort-controls.component.html',
  styleUrl: './sort-controls.component.scss'
})
export class SortControlsComponent {
  @Input() currentSortBy: SortBy = 'wins' as SortBy;
  @Input() currentSortDirection: SortDirection = 'desc' as SortDirection;
  @Output() sortChange = new EventEmitter<SortOptions>();

  /**
   * Handles sort field change from select
   */
  onSortByChange(value: string): void {
    this.currentSortBy = value as SortBy;
    this.emitSortChange();
  }

  /**
   * Handles sort field and direction change
   */
  onSortChange(sortBy: SortBy, sortDirection: SortDirection): void {
    this.currentSortBy = sortBy;
    this.currentSortDirection = sortDirection;
    this.emitSortChange();
  }

  /**
   * Toggles sort direction between asc and desc
   */
  toggleSortDirection(): void {
    this.setCurrentSortDirection();
    this.emitSortChange();
  }

  /**
   * Gets display label for sort field
   */
  getSortByLabel(sortBy: SortBy): string {
    return SortByLabels[sortBy];
  }

  /**
   * Emits sort change event
   */
  private emitSortChange(): void {
    this.sortChange.emit({
      sortBy: this.currentSortBy,
      sortDirection: this.currentSortDirection
    });
  }

  private setCurrentSortDirection() {
    this.currentSortDirection = this.currentSortDirection === SortDirection.asc ? SortDirection.desc : SortDirection.asc;
  }
}
