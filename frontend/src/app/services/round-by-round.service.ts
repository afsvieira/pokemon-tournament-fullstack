import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tournament } from '../models/tournament.model';
import { Round } from '../models/round.model';
import { ProcessedRound } from '../models/processed-round.model';
import { Battle } from '../models/battle.model';
import { TournamentHistoryEntry } from '../models/tournament-history-entry.model';
import { API_BASE_URL } from './api-base-url';

@Injectable({
  providedIn: 'root'
})
export class RoundByRoundService {
  constructor(private http: HttpClient) { }

  /**
   * Starts a round-by-round Tournament with 16 random Pokémon
   * @returns Observable of the new Tournament, every Pokémon at 0 wins, losses and ties
   */
  startTournament(): Observable<Tournament> {
    return this.http.post<Tournament>(API_BASE_URL, null);
  }

  /**
   * Fetches a Tournament held by the API
   * @param id - The Tournament's id
   * @returns Observable of the Tournament with its current Standings
   */
  getTournament(id: string): Observable<Tournament> {
    return this.http.get<Tournament>(`${API_BASE_URL}/${id}`);
  }

  /**
   * Processes the Tournament's next Round; the API picks which one
   * @param id - The Tournament's id
   * @returns Observable of the Round just played, with the updated Standings
   */
  processRound(id: string): Observable<ProcessedRound> {
    return this.http.post<ProcessedRound>(`${API_BASE_URL}/${id}/rounds`, null);
  }

  /**
   * Fetches a played Round
   * @param id - The Tournament's id
   * @param roundNumber - The Round's number, 1 to 15
   * @returns Observable of the Round with its 8 Battles
   */
  getRound(id: string, roundNumber: number): Observable<Round> {
    return this.http.get<Round>(`${API_BASE_URL}/${id}/rounds/${roundNumber}`);
  }

  /**
   * Fetches a played Battle
   * @param id - The Tournament's id
   * @param battleId - The Battle's number within the Tournament, 1 to 120
   * @returns Observable of the Battle with both Pokémon and its winner
   */
  getBattle(id: string, battleId: number): Observable<Battle> {
    return this.http.get<Battle>(`${API_BASE_URL}/${id}/battles/${battleId}`);
  }

  /**
   * Fetches the Tournament History: every Tournament started since the API last started
   * @returns Observable of the History entries, newest first, Complete or not
   */
  getHistory(): Observable<TournamentHistoryEntry[]> {
    return this.http.get<TournamentHistoryEntry[]>(`${API_BASE_URL}/history`);
  }
}
