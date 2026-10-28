import { TournamentPokemon } from './tournament-pokemon.model';

export interface Tournament {
  id: string;
  /** UTC ISO 8601 */
  startedAt: string;
  roundsPlayed: number;
  /** The 16 Pokémon in Start order, without battle records */
  standings: TournamentPokemon[];
}
