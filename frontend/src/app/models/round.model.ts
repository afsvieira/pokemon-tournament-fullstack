import { Battle } from './battle.model';

export interface Round {
  roundNumber: number;
  /** The Round's 8 Battles */
  battles: Battle[];
}
