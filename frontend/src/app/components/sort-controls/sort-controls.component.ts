import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SortBy, SortDirection, SortOptions } from '../../models';

@Component({
  selector: 'app-sort-controls',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './sort-controls.component.html',
  styleUrl: './sort-controls.component.scss'
})
export class SortControlsComponent {
  @Input() currentSortBy: SortBy = 'wins';
  @Input() currentSortDirection: SortDirection = 'desc';
  @Output() sortChange = new EventEmitter<SortOptions>();

  /**
   * Handles sort field change from select
   */
  onSortByChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.currentSortBy = target.value as SortBy;
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
    this.currentSortDirection = this.currentSortDirection === 'asc' ? 'desc' : 'asc';
    this.emitSortChange();
  }

  /**
   * Gets display label for sort field
   */
  getSortByLabel(sortBy: SortBy): string {
    const labels: Record<SortBy, string> = {
      wins: 'Wins',
      losses: 'Losses',
      ties: 'Ties',
      name: 'Name',
      id: 'ID'
    };
    return labels[sortBy];
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
}
