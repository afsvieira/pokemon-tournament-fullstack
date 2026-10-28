import { Round } from './round.model';
import { TournamentPokemon } from './tournament-pokemon.model';

/** Process Round's answer: the Round just played, with the Standings it left behind */
export interface ProcessedRound extends Round {
  /** The 16 Pokémon in Start order, without battle records */
  standings: TournamentPokemon[];
}
