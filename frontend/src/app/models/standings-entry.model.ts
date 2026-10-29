import { TournamentPokemon } from './tournament-pokemon.model';

/** A Pokémon of the Standings with its Position */
export interface StandingsEntry extends TournamentPokemon {
  /** By the default order; shared when wins, losses and ties are equal */
  position: number;
}
