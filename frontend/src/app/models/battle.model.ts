import { BattlePokemon } from './battle-pokemon.model';

export interface Battle {
  /** The Battle's number within its Tournament, 1 to 120 in play order */
  id: number;
  roundNumber: number;
  /** Whichever Pokémon comes first in the Start order */
  pokemon1: BattlePokemon;
  pokemon2: BattlePokemon;
  /** The winner's Pokémon id, or null on a tie */
  winnerId: number | null;
}
