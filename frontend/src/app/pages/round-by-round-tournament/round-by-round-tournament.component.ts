import { Component, DestroyRef, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, of, switchMap } from 'rxjs';
import { Tournament } from '../../models/tournament.model';
import { Round } from '../../models/round.model';
import { TournamentPokemon } from '../../models/tournament-pokemon.model';
import { SortBy, SortDirection, SortOptions } from '../../models/sort-options.model';
import { RoundByRoundService } from '../../services/round-by-round.service';
import { PokemonCardComponent } from '../../components/pokemon-card/pokemon-card.component';
import { SortControlsComponent } from '../../components/sort-controls/sort-controls.component';
import { StartTournamentButtonComponent } from '../../components/start-tournament-button/start-tournament-button.component';
import { RoundPanelComponent } from '../../components/round-panel/round-panel.component';
import { ErrorToastComponent } from '../../components/error-toast/error-toast.component';
import { getErrorMessage } from '../../shared/error-message';

@Component({
  selector: 'app-round-by-round-tournament',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    PokemonCardComponent,
    SortControlsComponent,
    StartTournamentButtonComponent,
    RoundPanelComponent,
    ErrorToastComponent
  ],
  templateUrl: './round-by-round-tournament.component.html',
  styleUrl: './round-by-round-tournament.component.scss'
})
export class RoundByRoundTournamentComponent implements OnInit {
  readonly roundCount = 15;

  tournament: Tournament | null = null;
  currentRound: Round | null = null;
  isLoading = false;
  isProcessing = false;
  toastMessage = '';
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
   * Whether all 15 Rounds have been played, so Process Round gives way to the Complete badge
   */
  get isComplete(): boolean {
    return this.tournament?.roundsPlayed === this.roundCount;
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
   * Loads the Tournament shown by this page, plus its last played Round when there is one;
   * also what Retry does after a failed load
   * @param onLoaded - Runs once both have loaded, never after a failure
   */
  loadTournament(onLoaded?: () => void): void {
    this.isLoading = true;
    this.loadErrorMessage = '';
    this.isTournamentGone = false;

    this.roundByRoundService.getTournament(this.tournamentId).pipe(
      switchMap((tournament) => tournament.roundsPlayed === 0
        ? of({ tournament, lastRound: null })
        : this.roundByRoundService.getRound(tournament.id, tournament.roundsPlayed)
          .pipe(map((lastRound) => ({ tournament, lastRound }))))
    ).subscribe({
      next: ({ tournament, lastRound }) => {
        this.tournament = tournament;
        this.currentRound = lastRound;
        this.isLoading = false;
        onLoaded?.();
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
   * Processes the next Round, then shows it and the Standings it left behind.
   * A failure shows a toast and leaves the page as it was; a 409 means another tab completed the Tournament,
   * so the page reloads the Tournament and its last Round, and only then says so.
   */
  processRound(): void {
    this.isProcessing = true;

    this.roundByRoundService.processRound(this.tournamentId).subscribe({
      next: (processedRound) => {
        this.currentRound = { roundNumber: processedRound.roundNumber, battles: processedRound.battles };
        this.tournament = {
          ...this.tournament!,
          roundsPlayed: processedRound.roundNumber,
          standings: processedRound.standings
        };
        this.isProcessing = false;
      },
      error: (error: HttpErrorResponse) => {
        this.isProcessing = false;
        if (this.handledAsTournamentGone(error)) {
          return;
        }
        const message = getErrorMessage(error);
        if (error.status === HttpStatusCode.Conflict) {
          this.loadTournament(() => this.toastMessage = message);
        } else {
          this.toastMessage = message;
        }
      }
    });
  }

  /**
   * Clears the toast once it is closed or hides itself
   */
  hideToast(): void {
    this.toastMessage = '';
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
    this.toastMessage = '';
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
