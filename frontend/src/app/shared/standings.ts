import { TournamentPokemon } from '../models/tournament-pokemon.model';
import { StandingsEntry } from '../models/standings-entry.model';

/**
 * Orders two Pokémon by record: most wins, then fewest losses
 * @returns Negative when a comes first, positive when b does, zero for equal records
 */
export function compareByRecord(a: TournamentPokemon, b: TournamentPokemon): number {
  return b.wins - a.wins || a.losses - b.losses;
}

/**
 * Orders two Pokémon as the Standings show them by default: by record, then name
 * @returns Negative when a comes first, positive when b does
 */
export function compareByDefaultOrder(a: TournamentPokemon, b: TournamentPokemon): number {
  return compareByRecord(a, b) || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
}

/**
 * Gives every Pokémon its Position, in the default order: one more than the number of Pokémon with a better record,
 * so equal records share a Position and the next one skips (1, 1, 3).
 * Every Pokémon has fought once per Round, so equal wins and losses mean equal ties too.
 * @param standings - The Standings as the API returns them
 * @returns The Standings in the default order, each with its Position
 */
export function positionStandings(standings: TournamentPokemon[]): StandingsEntry[] {
  return [...standings]
    .sort(compareByDefaultOrder)
    .map((pokemon) => ({
      ...pokemon,
      position: 1 + standings.filter((other) => compareByRecord(other, pokemon) < 0).length
    }));
}
