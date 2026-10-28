import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tournament } from '../models/tournament.model';
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
}
