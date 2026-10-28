import { Tournament } from '../models/tournament.model';

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
