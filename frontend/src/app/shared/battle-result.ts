import { Battle } from '../models/battle.model';

/**
 * Words a Battle's result as the round-by-round views show it
 * @param battle - A played Battle
 * @returns The winner's name and "wins", e.g. "Pikachu wins", or "Tie"
 */
export function getBattleResultLabel(battle: Battle): string {
  if (battle.winnerId === null) {
    return 'Tie';
  }
  const winner = battle.winnerId === battle.pokemon1.id ? battle.pokemon1 : battle.pokemon2;
  return `${winner.name} wins`;
}

/**
 * Colours a Battle's result: a win green, a tie grey
 * @param battle - A played Battle
 * @returns The Bootstrap text colour class for its result
 */
export function getBattleResultClass(battle: Battle): string {
  return battle.winnerId === null ? 'text-secondary' : 'text-success';
}
