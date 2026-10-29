import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass, TitleCasePipe } from '@angular/common';
import { StandingsEntry } from '../../models/standings-entry.model';
import { SortBy, SortDirection, SortOptions } from '../../models/sort-options.model';
import { getTypeIconClass } from '../../models/icons.mapping';

/** A sortable column: the sort field it holds, its header and how its cells are laid out */
interface StandingsColumn {
  field: SortBy;
  /** What sighted users read, e.g. "W" */
  label: string;
  /** The full word assistive technology reads instead of an abbreviated label, e.g. "Wins" */
  name?: string;
  /** Bootstrap classes shared by the header and its cells: alignment, and hiding the id below the small breakpoint */
  cellClass: string;
}

@Component({
  selector: 'app-standings',
  standalone: true,
  imports: [NgClass, TitleCasePipe],
  templateUrl: './standings.component.html',
  styleUrl: './standings.component.scss'
})
export class StandingsComponent {
  /** The Standings in the order to show, each with its Position */
  @Input({ required: true }) entries: StandingsEntry[] = [];
  @Input({ required: true }) sortBy: SortBy = SortBy.wins;
  @Input({ required: true }) sortDirection: SortDirection = SortDirection.desc;
  /** Whether the Tournament is Complete, so the rows on Position 1 are highlighted */
  @Input() isComplete = false;
  /** Emitted with the new sort when a header is clicked; the page sorts locally */
  @Output() sortChange = new EventEmitter<SortOptions>();

  /** The sortable columns, after the Position column */
  readonly columns: StandingsColumn[] = [
    { field: SortBy.name, label: 'Pokémon', cellClass: '' },
    { field: SortBy.wins, label: 'W', name: 'Wins', cellClass: 'text-center' },
    { field: SortBy.losses, label: 'L', name: 'Losses', cellClass: 'text-center' },
    { field: SortBy.ties, label: 'T', name: 'Ties', cellClass: 'text-center' },
    { field: SortBy.id, label: 'ID', cellClass: 'd-none d-sm-table-cell text-end' }
  ];

  /**
   * Sorts by the clicked header: the record columns start descending and name and id ascending;
   * a second click on the same header flips the direction
   */
  sort(field: SortBy): void {
    const sortDirection = field === this.sortBy
      ? (this.sortDirection === SortDirection.desc ? SortDirection.asc : SortDirection.desc)
      : this.firstDirection(field);
    this.sortChange.emit({ sortBy: field, sortDirection });
  }

  /**
   * The sorted header's aria-sort, null on the others
   */
  getAriaSort(field: SortBy): 'ascending' | 'descending' | null {
    if (field !== this.sortBy) {
      return null;
    }
    return this.sortDirection === SortDirection.asc ? 'ascending' : 'descending';
  }

  /**
   * The sorted header's direction icon, none on the others
   */
  getSortIcon(field: SortBy): string {
    if (field !== this.sortBy) {
      return '';
    }
    return this.sortDirection === SortDirection.asc ? 'fa-solid fa-arrow-up-short-wide' : 'fa-solid fa-arrow-down-wide-short';
  }

  /**
   * Whether the Pokémon leads a Complete Tournament, so its row is highlighted with a trophy
   */
  isLeader(entry: StandingsEntry): boolean {
    return this.isComplete && entry.position === 1;
  }

  /**
   * The Pokémon's id as the Instant Simulation cards show it, e.g. "#025"
   */
  formatId(entry: StandingsEntry): string {
    return `#${entry.id.toString().padStart(3, '0')}`;
  }

  getTypeIcon(type: string): string {
    return getTypeIconClass(type);
  }

  private firstDirection(field: SortBy): SortDirection {
    return field === SortBy.name || field === SortBy.id ? SortDirection.asc : SortDirection.desc;
  }
}
