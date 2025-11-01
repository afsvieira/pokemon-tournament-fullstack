import { BattleRecord } from './battle-record.model';

export interface TournamentPokemon {
  id: number;
  name: string;
  type: string;
  baseExperience: number;
  wins: number;
  losses: number;
  ties: number;
  winRate: number;
  battleRecords?: BattleRecord[];
}