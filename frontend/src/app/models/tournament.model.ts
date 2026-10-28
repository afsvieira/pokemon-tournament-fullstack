import { TournamentPokemon } from './tournament-pokemon.model';

/** Rounds in every Tournament; it is Complete once all of them are played */
export const ROUND_COUNT = 15;

export interface Tournament {
  id: string;
  /** UTC ISO 8601 */
  startedAt: string;
  roundsPlayed: number;
  /** The 16 Pokémon in Start order, without battle records */
  standings: TournamentPokemon[];
}
