import { Component, DestroyRef, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, map, of, switchMap } from 'rxjs';
import { ROUND_COUNT, Tournament } from '../../models/tournament.model';
import { Round } from '../../models/round.model';
import { StandingsEntry } from '../../models/standings-entry.model';
import { TournamentPokemon } from '../../models/tournament-pokemon.model';
import { SortBy, SortDirection, SortOptions } from '../../models/sort-options.model';
import { RoundByRoundService } from '../../services/round-by-round.service';
import { StandingsComponent } from '../../components/standings/standings.component';
import { StartTournamentButtonComponent } from '../../components/start-tournament-button/start-tournament-button.component';
import { RoundPanelComponent } from '../../components/round-panel/round-panel.component';
import { ErrorToastComponent } from '../../components/error-toast/error-toast.component';
import { BattleModalComponent } from '../../components/battle-modal/battle-modal.component';
import { getErrorMessage } from '../../shared/error-message';
import { RATE_LIMIT_WINDOW_SECONDS } from '../../shared/rate-limit';
import { compareByDefaultOrder, positionStandings } from '../../shared/standings';

@Component({
  selector: 'app-round-by-round-tournament',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    StandingsComponent,
    StartTournamentButtonComponent,
    RoundPanelComponent,
    ErrorToastComponent,
    BattleModalComponent
  ],
  templateUrl: './round-by-round-tournament.component.html',
  styleUrl: './round-by-round-tournament.component.scss'
})
export class RoundByRoundTournamentComponent implements OnInit {
  readonly roundCount = ROUND_COUNT;

  tournament: Tournament | null = null;
  currentRound: Round | null = null;
  /** The Battle open in the modal, or null while the modal is closed */
  openBattleId: number | null = null;
  isLoading = false;
  isProcessing = false;
  toastMessage = '';
  /** Whether the toast stays until dismissed: after a 429, so the user isn't invited to hit the same wall */
  isToastPersistent = false;
  /** Seconds left before Process Round can be pressed again after a 429; 0 while it can */
  retryAfterSeconds = 0;
  loadErrorMessage = '';
  isTournamentGone = false;
  currentSortBy: SortBy = SortBy.wins;
  currentSortDirection: SortDirection = SortDirection.desc;
  /** What the polite live region says: "Round N processed" after Process Round, nothing otherwise */
  announcement = '';
  /** The Round just played by Process Round, which the Round panel focuses and pulses; null otherwise */
  justProcessedRound: number | null = null;
  /** The current Standings with their Positions and Movement, sorted by the clicked header; kept, not recomputed */
  sortedStandings: StandingsEntry[] = [];

  private tournamentId = '';
  /** The Standings before the last Round processed on this page, for the Movement; null until one is */
  private previousStandings: TournamentPokemon[] | null = null;
  /** The current Standings in default order with their Positions, the source of sortedStandings and completeLine */
  private positionedStandings: StandingsEntry[] = [];
  /** Rounds fetched or played so far, by number; a played Round never changes, so each is fetched once */
  private readonly playedRounds = new Map<number, Round>();
  /** A chip's Round still loading; dropped when another Round takes the panel, so its late answer can't replace it */
  private roundRequest?: Subscription;
  /** The Tournament still loading; dropped when another load starts, so a slow answer can't replace a newer one */
  private loadRequest?: Subscription;
  /** The Round still being processed; dropped when the page moves to another Tournament */
  private processRequest?: Subscription;
  /** Counts the rate-limit window down after a 429 */
  private retryTimer?: ReturnType<typeof setInterval>;

  constructor(
    private route: ActivatedRoute,
    private roundByRoundService: RoundByRoundService,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => clearInterval(this.retryTimer));
    // The router reuses this page when only the id changes, so load on every id rather than once;
    // loadTournament drops the previous id's requests, so a slow answer never lands on the new Tournament
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.tournamentId = params.get('id')!;
        this.playedRounds.clear();
        this.openBattleId = null;
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
   * Whether Process Round can't be pressed: while a Round is being processed or a rate-limit window is waited out
   */
  get isProcessRoundDisabled(): boolean {
    return this.isProcessing || this.retryAfterSeconds > 0;
  }

  /**
   * Process Round's label: the remaining wait after a 429, or the action itself
   */
  get processRoundLabel(): string {
    return this.retryAfterSeconds > 0 ? `Try again in ${this.retryAfterSeconds} s` : 'Process Round';
  }

  /**
   * Whether all 15 Rounds have been played, so Process Round gives way to the Complete badge
   */
  get isComplete(): boolean {
    return this.tournament?.roundsPlayed === this.roundCount;
  }

  /**
   * The closing line of a Complete Tournament: "Complete · Alakazam leads the Standings 14–0–1",
   * naming every Pokémon on Position 1 in default order; empty while the Tournament is in play
   */
  get completeLine(): string {
    if (!this.isComplete) {
      return '';
    }
    const leaders = this.positionedStandings.filter((entry) => entry.position === 1);
    if (leaders.length === 0) {
      return 'Complete';
    }
    const verb = leaders.length > 1 ? 'lead' : 'leads';
    const { wins, losses, ties } = leaders[0];
    return `Complete · ${this.joinNames(leaders.map((leader) => leader.name))} ${verb} the Standings ${wins}–${losses}–${ties}`;
  }

  /**
   * One chip per Round, 1 to 15
   */
  get roundNumbers(): number[] {
    return Array.from({ length: this.roundCount }, (_, index) => index + 1);
  }

  /**
   * Whether a Round has been played, so its chip can be clicked
   */
  isRoundPlayed(roundNumber: number): boolean {
    return roundNumber <= (this.tournament?.roundsPlayed ?? 0);
  }

  /**
   * Whether a Round is the one shown in the Round panel, so its chip is highlighted
   */
  isRoundSelected(roundNumber: number): boolean {
    return this.currentRound?.roundNumber === roundNumber;
  }

  /**
   * Handles a header click in the Standings
   */
  onSortChange(sortOptions: SortOptions): void {
    this.currentSortBy = sortOptions.sortBy;
    this.currentSortDirection = sortOptions.sortDirection;
    this.updateStandings();
  }

  /**
   * Recomputes the Standings shown whenever the Tournament, the previous Standings or the sort change,
   * rather than on every change detection: Positions and Movement in default order, then the clicked header's
   * order, where Pokémon equal on that field keep the default order so the Standings are deterministic
   */
  private updateStandings(): void {
    const direction = this.currentSortDirection === SortDirection.desc ? -1 : 1;
    this.positionedStandings = positionStandings(this.tournament?.standings ?? [], this.previousStandings);
    this.sortedStandings = [...this.positionedStandings]
      .sort((a, b) => direction * this.compareBySortField(a, b) || compareByDefaultOrder(a, b));
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
    // Requests for the Tournament shown until now must not land on this one
    this.loadRequest?.unsubscribe();
    this.roundRequest?.unsubscribe();
    this.processRequest?.unsubscribe();
    this.isProcessing = false;
    // The rate limit is per client, not per Tournament, so a countdown and its toast survive a change of Tournament
    // A loaded Tournament has no Round this page witnessed, so the Standings show no Movement,
    // nothing is announced and the Round panel is left alone
    this.previousStandings = null;
    this.announcement = '';
    this.justProcessedRound = null;

    this.loadRequest = this.roundByRoundService.getTournament(this.tournamentId).pipe(
      switchMap((tournament) => tournament.roundsPlayed === 0
        ? of({ tournament, lastRound: null })
        : this.roundByRoundService.getRound(tournament.id, tournament.roundsPlayed)
          .pipe(map((lastRound) => ({ tournament, lastRound })))),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ({ tournament, lastRound }) => {
        this.tournament = tournament;
        this.updateStandings();
        this.showRound(lastRound);
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
   * Processes the next Round, then shows it and the Standings it left behind, keeping the ones it replaces
   * so each row can show its Movement.
   * A failure shows a toast and leaves the page as it was; a 409 means another tab completed the Tournament,
   * so the page reloads the Tournament and its last Round, and only then says so.
   */
  processRound(): void {
    this.isProcessing = true;
    this.announcement = '';

    this.processRequest = this.roundByRoundService.processRound(this.tournamentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (processedRound) => {
          this.roundRequest?.unsubscribe();
          this.showRound({ roundNumber: processedRound.roundNumber, battles: processedRound.battles });
          this.announcement = `Round ${processedRound.roundNumber} processed`;
          this.justProcessedRound = processedRound.roundNumber;
          this.previousStandings = this.tournament!.standings;
          this.tournament = {
            ...this.tournament!,
            roundsPlayed: processedRound.roundNumber,
            standings: processedRound.standings
          };
          this.updateStandings();
          this.isProcessing = false;
        },
        error: (error: HttpErrorResponse) => {
          this.isProcessing = false;
          if (this.handledAsTournamentGone(error)) {
            return;
          }
          if (error.status === HttpStatusCode.Conflict) {
            this.loadTournament(() => this.showToast(getErrorMessage(error)));
          } else {
            this.showRequestError(error);
          }
        }
      });
  }

  /**
   * Shows a played Round in the Round panel, fetching it the first time only; the Standings stay current.
   * A failure shows a toast and keeps the Round that was selected.
   * @param roundNumber - The chip's Round number
   */
  selectRound(roundNumber: number): void {
    this.roundRequest?.unsubscribe();
    this.announcement = '';
    const playedRound = this.playedRounds.get(roundNumber);
    if (playedRound) {
      this.showRound(playedRound);
      return;
    }

    this.roundRequest = this.roundByRoundService.getRound(this.tournamentId, roundNumber)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (round) => this.showRound(round),
        error: (error: HttpErrorResponse) => {
          if (!this.handledAsTournamentGone(error)) {
            this.showRequestError(error);
          }
        }
      });
  }

  /**
   * Opens a Battle in the modal, which fetches it
   * @param battleId - The clicked row's Battle id
   */
  openBattle(battleId: number): void {
    this.openBattleId = battleId;
  }

  /**
   * Closes the Battle modal
   */
  closeBattle(): void {
    this.openBattleId = null;
  }

  /**
   * Clears the toast once it is closed or hides itself
   */
  hideToast(): void {
    this.toastMessage = '';
    this.isToastPersistent = false;
  }

  /**
   * Shows a failed request's message in the toast. A 429, from Process Round or a Round chip alike, keeps the toast
   * until dismissed and makes Process Round wait out the rate-limit window, so the user isn't invited to hit the same wall
   */
  private showRequestError(error: HttpErrorResponse): void {
    const isRateLimited = error.status === HttpStatusCode.TooManyRequests;
    this.showToast(getErrorMessage(error), isRateLimited);
    if (isRateLimited) {
      this.waitOutRateLimit();
    }
  }

  /**
   * Shows the toast, hiding itself after a while unless persistent
   */
  private showToast(message: string, persistent = false): void {
    this.toastMessage = message;
    this.isToastPersistent = persistent;
  }

  /**
   * Disables Process Round for the rate limit's window, counting the seconds down in its label
   */
  private waitOutRateLimit(): void {
    clearInterval(this.retryTimer);
    this.retryAfterSeconds = RATE_LIMIT_WINDOW_SECONDS;
    this.retryTimer = setInterval(() => {
      this.retryAfterSeconds--;
      if (this.retryAfterSeconds <= 0) {
        clearInterval(this.retryTimer);
      }
    }, 1000);
  }

  /**
   * Replaces the whole page, and the Battle modal if open, with "This Tournament no longer exists";
   * also what the Battle modal asks for when its Battle answers 404
   */
  showTournamentGone(): void {
    this.isTournamentGone = true;
    this.openBattleId = null;
    this.hideToast();
  }

  /**
   * Shows that the Tournament no longer exists when the API answers 404.
   * Every request this page makes gets a 404 once the API has restarted, so each one routes its errors here first.
   * @param error - The failed request's error response
   * @returns Whether the error was a 404, now handled; otherwise the caller shows the error its own way
   */
  private handledAsTournamentGone(error: HttpErrorResponse): boolean {
    if (error.status !== HttpStatusCode.NotFound) {
      return false;
    }
    this.showTournamentGone();
    return true;
  }

  /**
   * "Alakazam", "Alakazam and Primeape", "Alakazam, Mew and Primeape"
   */
  private joinNames(names: string[]): string {
    return names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0];
  }

  private showRound(round: Round | null): void {
    if (round) {
      this.playedRounds.set(round.roundNumber, round);
    }
    this.currentRound = round;
  }

  private compareBySortField(a: StandingsEntry, b: StandingsEntry): number {
    const valueA = a[this.currentSortBy];
    const valueB = b[this.currentSortBy];

    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return valueA.localeCompare(valueB, undefined, { sensitivity: 'base' });
    }
    return Number(valueA) - Number(valueB);
  }
}
