import { Routes } from '@angular/router';
import { TournamentComponent } from './pages/tournament/tournament.component';

export const routes: Routes = [
  { path: '', redirectTo: '/tournament', pathMatch: 'full' },
  { path: 'tournament', component: TournamentComponent },
  { path: '**', redirectTo: '/tournament' }
];
