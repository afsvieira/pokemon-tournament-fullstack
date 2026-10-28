import { Component } from '@angular/core';
import { StartTournamentButtonComponent } from '../../components/start-tournament-button/start-tournament-button.component';

@Component({
  selector: 'app-tournament-history',
  standalone: true,
  imports: [StartTournamentButtonComponent],
  templateUrl: './tournament-history.component.html'
})
export class TournamentHistoryComponent {}
