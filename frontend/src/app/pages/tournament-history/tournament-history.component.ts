import { Component } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { RoundByRoundService } from '../../services/round-by-round.service';
import { ErrorToastComponent } from '../../components/error-toast/error-toast.component';
import { getErrorMessage } from '../../shared/error-message';

@Component({
  selector: 'app-tournament-history',
  standalone: true,
  imports: [ErrorToastComponent],
  templateUrl: './tournament-history.component.html',
  styleUrl: './tournament-history.component.scss'
})
export class TournamentHistoryComponent {
  isStarting = false;
  toastMessage = '';

  constructor(private roundByRoundService: RoundByRoundService, private router: Router) {}

  /**
   * Starts a new Tournament, then opens its page
   */
  startTournament(): void {
    this.isStarting = true;

    this.roundByRoundService.startTournament().subscribe({
      next: (tournament) => {
        this.router.navigate(['/round-by-round', tournament.id]);
      },
      error: (error: HttpErrorResponse) => {
        this.isStarting = false;
        this.toastMessage = getErrorMessage(error);
      }
    });
  }

  /**
   * Clears the toast once it is closed or hides itself
   */
  hideToast(): void {
    this.toastMessage = '';
  }
}
