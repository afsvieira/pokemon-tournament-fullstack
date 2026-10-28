import { Tournament } from '../models/tournament.model';
import { TournamentPokemon } from '../models/tournament-pokemon.model';
import { Round } from '../models/round.model';
import { ProcessedRound } from '../models/processed-round.model';
import { Battle } from '../models/battle.model';

/**
 * Builds a Tournament as the API returns it right after Start: 16 Pokémon at 0 wins, losses and ties.
 */
export function createStartedTournament(): Tournament {
  return {
    id: '3f2b8c1e-4d5a-4b6c-8e7f-9a0b1c2d3e4f',
    startedAt: '2026-10-28T14:02:00+00:00',
    roundsPlayed: 0,
    standings: Array.from({ length: 16 }, (_, index) => ({
      id: index + 1,
      name: `Pokemon${index + 1}`,
      type: 'normal',
      baseExperience: 50 + index,
      imageUrl: `https://img.example/${index + 1}.png`,
      wins: 0,
      losses: 0,
      ties: 0,
      winRate: 0
    }))
  };
}

/**
 * Builds a played Round of that Tournament: Battle i pits Pokemon(2i+1) against Pokemon(2i+2) and the first one wins,
 * except the Round's third Battle, which is a tie.
 */
export function createRound(roundNumber: number): Round {
  const standings = createStartedTournament().standings;

  return {
    roundNumber,
    battles: Array.from({ length: 8 }, (_, index): Battle => {
      const [pokemon1, pokemon2] = [standings[2 * index], standings[2 * index + 1]];
      return {
        id: 8 * (roundNumber - 1) + index + 1,
        roundNumber,
        pokemon1: toBattlePokemon(pokemon1),
        pokemon2: toBattlePokemon(pokemon2),
        winnerId: index === 2 ? null : pokemon1.id
      };
    })
  };
}

/**
 * Builds Process Round's answer for that Round, with Standings that count only its Battles.
 */
export function createProcessedRound(roundNumber: number): ProcessedRound {
  const round = createRound(roundNumber);
  const standings = createStartedTournament().standings.map((pokemon) => {
    const fought = round.battles.filter((battle) => [battle.pokemon1.id, battle.pokemon2.id].includes(pokemon.id));
    const wins = fought.filter((battle) => battle.winnerId === pokemon.id).length;
    return {
      ...pokemon,
      wins,
      losses: fought.filter((battle) => battle.winnerId !== null && battle.winnerId !== pokemon.id).length,
      ties: fought.filter((battle) => battle.winnerId === null).length,
      winRate: wins * 100
    };
  });

  return { ...round, standings };
}

function toBattlePokemon({ id, name, type, baseExperience, imageUrl }: TournamentPokemon) {
  return { id, name, type, baseExperience, imageUrl };
}
