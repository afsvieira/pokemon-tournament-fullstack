import { Component } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { RoundByRoundService } from '../../services/round-by-round.service';
import { ErrorToastComponent } from '../error-toast/error-toast.component';
import { getErrorMessage } from '../../shared/error-message';

@Component({
  selector: 'app-start-tournament-button',
  standalone: true,
  imports: [ErrorToastComponent],
  templateUrl: './start-tournament-button.component.html',
  styleUrl: './start-tournament-button.component.scss'
})
export class StartTournamentButtonComponent {
  isStarting = false;
  toastMessage = '';

  constructor(private roundByRoundService: RoundByRoundService, private router: Router) {}

  /**
   * Starts a new Tournament, then opens its page; a failure shows a toast and enables the button again
   */
  startTournament(): void {
    this.isStarting = true;

    this.roundByRoundService.startTournament().subscribe({
      next: (tournament) => {
        // The spinner stays until the new page replaces this button, so a second click can't start another
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
