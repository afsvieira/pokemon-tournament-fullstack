// Enum for battle outcomes (matching C# BattleOutcomeEnum)
export enum BattleOutcome {
  Win = 'Win',
  Loss = 'Loss',
  Tie = 'Tie'
}

export interface BattleRecord {
  opponentName: string;
  opponentType: string;
  result: BattleOutcome;
}

// Helper function to get display label for battle result
export function getBattleResultLabel(result: BattleOutcome): string {
  switch (result) {
    case BattleOutcome.Win:
      return 'Win';
    case BattleOutcome.Loss:
      return 'Loss';
    case BattleOutcome.Tie:
      return 'Tie';
    default:
      return 'Unknown';
  }
}

// Helper function to get CSS class for styling
export function getBattleResultClass(result: BattleOutcome): string {
  switch (result) {
    case BattleOutcome.Win:
      return 'result-win';
    case BattleOutcome.Loss:
      return 'result-loss';
    case BattleOutcome.Tie:
      return 'result-tie';
    default:
      return 'result-unknown';
  }
}
