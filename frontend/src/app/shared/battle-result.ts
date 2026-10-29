import { Battle } from '../models/battle.model';
import { BattlePokemon } from '../models/battle-pokemon.model';

/**
 * Words a Battle's result as the round-by-round views show it
 * @param battle - A played Battle
 * @returns The winner's name and "wins", e.g. "Pikachu wins", or "Tie"
 */
export function getBattleResultLabel(battle: Battle): string {
  if (isBattleTie(battle)) {
    return 'Tie';
  }
  const winner = battle.winnerId === battle.pokemon1.id ? battle.pokemon1 : battle.pokemon2;
  return `${winner.name} wins`;
}

/**
 * Tells whether a Battle ended in a tie, so the views can show "Tie" where a winner would be marked
 * @param battle - A played Battle
 * @returns True when neither Pokémon won
 */
export function isBattleTie(battle: Battle): boolean {
  return battle.winnerId === null;
}

/**
 * Tells whether a Pokémon won its Battle, so the views can mark the winner in place
 * @param battle - A played Battle
 * @param pokemon - One of the Battle's two Pokémon
 * @returns True for the winner; false for the loser and for both Pokémon of a tie
 */
export function isBattleWinner(battle: Battle, pokemon: BattlePokemon): boolean {
  return battle.winnerId === pokemon.id;
}
