import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TournamentPokemon } from '../models/tournament-pokemon.model';
import { SortBy, SortDirection } from '../models/sort-options.model';
import { API_BASE_URL } from './api-base-url';

@Injectable({
  providedIn: 'root'
})
export class TournamentService {
  private readonly apiUrl = `${API_BASE_URL}/statistics`;

  constructor(private http: HttpClient) { }

  /**
   * Fetches tournament statistics from the API with sorting options
   * @param sortBy - Field to sort by (wins, losses, ties, name, id)
   * @param sortDirection - Sort direction (asc or desc)
   * @returns Observable of tournament pokemon array
   */
  getTournamentStatistics(
    sortBy: SortBy,
    sortDirection: SortDirection = SortDirection.asc
  ): Observable<TournamentPokemon[]> {
    const params = new HttpParams()
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);

    return this.http.get<TournamentPokemon[]>(this.apiUrl, { params });
  }
}
