import { Component, DestroyRef, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Tournament } from '../../models/tournament.model';
import { TournamentPokemon } from '../../models/tournament-pokemon.model';
import { SortBy, SortDirection, SortOptions } from '../../models/sort-options.model';
import { RoundByRoundService } from '../../services/round-by-round.service';
import { PokemonCardComponent } from '../../components/pokemon-card/pokemon-card.component';
import { SortControlsComponent } from '../../components/sort-controls/sort-controls.component';
import { StartTournamentButtonComponent } from '../../components/start-tournament-button/start-tournament-button.component';
import { getErrorMessage } from '../../shared/error-message';

@Component({
  selector: 'app-round-by-round-tournament',
  standalone: true,
  imports: [DatePipe, RouterLink, PokemonCardComponent, SortControlsComponent, StartTournamentButtonComponent],
  templateUrl: './round-by-round-tournament.component.html',
  styleUrl: './round-by-round-tournament.component.scss'
})
export class RoundByRoundTournamentComponent implements OnInit {
  readonly roundCount = 15;

  tournament: Tournament | null = null;
  isLoading = false;
  loadErrorMessage = '';
  isTournamentGone = false;
  currentSortBy: SortBy = SortBy.wins;
  currentSortDirection: SortDirection = SortDirection.desc;

  private tournamentId = '';

  constructor(
    private route: ActivatedRoute,
    private roundByRoundService: RoundByRoundService,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    // The router reuses this page when only the id changes, so load on every id rather than once
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.tournamentId = params.get('id')!;
        this.loadTournament();
      });
  }

  /**
   * How far the Tournament has got, e.g. "Round 3 of 15"
   */
  get roundProgress(): string {
    return `Round ${this.tournament?.roundsPlayed ?? 0} of ${this.roundCount}`;
  }

  /**
   * The current Standings, sorted locally with the sort controls
   */
  get sortedStandings(): TournamentPokemon[] {
    const direction = this.currentSortDirection === SortDirection.desc ? -1 : 1;
    return [...(this.tournament?.standings ?? [])]
      .sort((a, b) => direction * this.compareBySortField(a, b));
  }

  /**
   * Handles sort change from sort controls component
   */
  onSortChange(sortOptions: SortOptions): void {
    this.currentSortBy = sortOptions.sortBy;
    this.currentSortDirection = sortOptions.sortDirection;
  }

  /**
   * Loads the Tournament shown by this page; also what Retry does after a failed load
   */
  loadTournament(): void {
    this.isLoading = true;
    this.loadErrorMessage = '';
    this.isTournamentGone = false;

    this.roundByRoundService.getTournament(this.tournamentId).subscribe({
      next: (tournament) => {
        this.tournament = tournament;
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        if (!this.handledAsTournamentGone(error)) {
          this.loadErrorMessage = getErrorMessage(error);
        }
      }
    });
  }

  /**
   * Replaces the whole page with "This Tournament no longer exists" when the API answers 404.
   * Every request this page makes gets a 404 once the API has restarted, so each one routes its errors here first.
   * @param error - The failed request's error response
   * @returns Whether the error was a 404, now handled; otherwise the caller shows the error its own way
   */
  private handledAsTournamentGone(error: HttpErrorResponse): boolean {
    if (error.status !== HttpStatusCode.NotFound) {
      return false;
    }
    this.isTournamentGone = true;
    return true;
  }

  private compareBySortField(a: TournamentPokemon, b: TournamentPokemon): number {
    const valueA = a[this.currentSortBy];
    const valueB = b[this.currentSortBy];

    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return valueA.localeCompare(valueB, undefined, { sensitivity: 'base' });
    }
    return Number(valueA) - Number(valueB);
  }
}
