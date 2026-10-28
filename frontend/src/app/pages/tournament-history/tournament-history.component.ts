import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ROUND_COUNT } from '../../models/tournament.model';
import { TournamentHistoryEntry } from '../../models/tournament-history-entry.model';
import { RoundByRoundService } from '../../services/round-by-round.service';
import { StartTournamentButtonComponent } from '../../components/start-tournament-button/start-tournament-button.component';
import { getErrorMessage } from '../../shared/error-message';

@Component({
  selector: 'app-tournament-history',
  standalone: true,
  imports: [DatePipe, RouterLink, StartTournamentButtonComponent],
  templateUrl: './tournament-history.component.html',
  styleUrl: './tournament-history.component.scss'
})
export class TournamentHistoryComponent implements OnInit {
  history: TournamentHistoryEntry[] = [];
  isLoading = false;
  loadErrorMessage = '';

  constructor(private roundByRoundService: RoundByRoundService) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  /**
   * Whether no Tournament was started since the API last started
   */
  get isEmpty(): boolean {
    return this.history.length === 0;
  }

  /**
   * How far a Tournament got, e.g. "7/15", or "15/15 ✔" once Complete
   */
  getRoundsLabel(entry: TournamentHistoryEntry): string {
    const label = `${entry.roundsPlayed}/${ROUND_COUNT}`;
    return this.isComplete(entry) ? `${label} ✔` : label;
  }

  /**
   * Whether all 15 Rounds of a Tournament have been played
   */
  isComplete(entry: TournamentHistoryEntry): boolean {
    return entry.roundsPlayed === ROUND_COUNT;
  }

  /**
   * Loads the Tournament History, newest first as the API returns it; also what Retry does after a failed load
   */
  loadHistory(): void {
    this.isLoading = true;
    this.loadErrorMessage = '';

    this.roundByRoundService.getHistory().subscribe({
      next: (history) => {
        this.history = history;
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.loadErrorMessage = getErrorMessage(error);
      }
    });
  }
}
