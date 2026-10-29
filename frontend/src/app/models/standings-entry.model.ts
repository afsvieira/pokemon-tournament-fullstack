import { TournamentPokemon } from './tournament-pokemon.model';

/** A Pokémon of the Standings with its Position */
export interface StandingsEntry extends TournamentPokemon {
  /** By the default order; shared when wins, losses and ties are equal */
  position: number;
  /** Positions gained since the last Round processed on the page (negative when lost), or null before any */
  movement: number | null;
}
