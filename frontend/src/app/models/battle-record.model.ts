export type BattleResult = 'Win' | 'Loss' | 'Tie' | 0 | 1 | 2;

export interface BattleRecord {
  opponentName: string;
  opponentType: string;
  result: BattleResult;
}

// Enum mapping for C# BattleOutcomeEnum
export const BattleOutcomeEnum = {
  Win: 0,
  Loss: 1,
  Tie: 2
} as const;

// Helper function to convert enum to string
export function getBattleResultString(result: BattleResult): string {
  if (typeof result === 'number') {
    switch (result) {
      case 0: return 'Win';
      case 1: return 'Loss';
      case 2: return 'Tie';
      default: return 'Unknown';
    }
  }
  return result as string;
}