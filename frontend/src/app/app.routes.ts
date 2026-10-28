import { Routes } from '@angular/router';
import { TournamentComponent } from './pages/tournament/tournament.component';
import { TournamentHistoryComponent } from './pages/tournament-history/tournament-history.component';
import { RoundByRoundTournamentComponent } from './pages/round-by-round-tournament/round-by-round-tournament.component';

export const routes: Routes = [
  { path: '', redirectTo: '/tournament', pathMatch: 'full' },
  { path: 'tournament', component: TournamentComponent },
  { path: 'round-by-round', component: TournamentHistoryComponent },
  { path: 'round-by-round/:id', component: RoundByRoundTournamentComponent },
  { path: '**', redirectTo: '/tournament' }
];
