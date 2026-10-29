import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass, TitleCasePipe } from '@angular/common';
import { StandingsEntry } from '../../models/standings-entry.model';
import { SortBy, SortDirection, SortOptions } from '../../models/sort-options.model';
import { getTypeIconClass } from '../../models/icons.mapping';

/** A column after Position: its header, how its cells are laid out and, when it sorts, its sort field */
interface StandingsColumn {
  /** The field a click on the header sorts by; absent on the Movement column, which doesn't sort */
  field?: SortBy;
  /** What sighted users read, e.g. "W" */
  label: string;
  /** The full word assistive technology reads instead of an abbreviated label, e.g. "Wins" */
  name?: string;
  /** Bootstrap classes of the header cell: alignment, and hiding Movement and the id below the small breakpoint */
  cellClass: string;
}

/** How a row shows its Movement */
interface MovementView {
  symbol: string;
  text: string;
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

  /** The columns after Position, in order; Movement and the id are hidden below the small breakpoint */
  readonly columns: StandingsColumn[] = [
    { field: SortBy.name, label: 'Pokémon', cellClass: '' },
    { field: SortBy.wins, label: 'W', name: 'Wins', cellClass: 'record text-center' },
    { field: SortBy.losses, label: 'L', name: 'Losses', cellClass: 'record text-center' },
    { field: SortBy.ties, label: 'T', name: 'Ties', cellClass: 'record text-center' },
    { label: 'Movement', cellClass: 'movement d-none d-sm-table-cell text-center' },
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
   * The Movement as the row shows it: the symbol sighted users see ("▲2", "▼1", or a dash when the Pokémon stayed
   * or no Round was processed on the page), the text assistive technology reads instead, and the cell's colour.
   * Before any Round is processed on the page the dash means "not witnessed", not "stayed", and the text says so
   */
  getMovement(entry: StandingsEntry): MovementView {
    if (entry.movement === null) {
      return { symbol: '–', text: 'no Round processed yet', cellClass: 'text-muted' };
    }
    if (entry.movement === 0) {
      return { symbol: '–', text: 'no change', cellClass: 'text-muted' };
    }
    if (entry.movement > 0) {
      return { symbol: `▲${entry.movement}`, text: `up ${entry.movement}`, cellClass: 'text-success-emphasis' };
    }
    return { symbol: `▼${-entry.movement}`, text: `down ${-entry.movement}`, cellClass: 'text-danger-emphasis' };
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
