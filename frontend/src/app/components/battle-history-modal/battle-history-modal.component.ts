import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TournamentPokemon } from '../../models/tournament-pokemon.model';
import { BattleOutcome, BattleRecord } from '../../models/battle-record.model';

@Component({
  selector: 'app-battle-history-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './battle-history-modal.component.html',
  styleUrl: './battle-history-modal.component.scss'
})
export class BattleHistoryModalComponent {
  @Input({ required: true }) pokemon!: TournamentPokemon;
  @Output() closeModal = new EventEmitter<void>();

  /**
   * Checks if the Pokemon has any battle records
   * Keeps logic out of template for better testability
   */
  get hasBattleRecords(): boolean {
    return !!this.pokemon.battleRecords && this.pokemon.battleRecords.length > 0;
  }

  /**
   * Maps battle records with computed styling properties
   * Moves presentation logic from template to component for cleaner HTML and easier testing
   */
  get pokemonRecords(): {
    battle: BattleRecord;
    isWin: boolean;
    isLoss: boolean;
    isTie: boolean;
    borderLeft: string;
    className: string;
  }[] {
    return this.pokemon.battleRecords?.map(battle => {
      const isWin = battle.result === BattleOutcome.Win;
      const isLoss = battle.result === BattleOutcome.Loss;
      const isTie = battle.result === BattleOutcome.Tie;

      return {
        battle,
        isWin,
        isLoss,
        isTie,
        borderLeft: `4px solid ${isWin ? '#198754' : isLoss ? '#dc3545' : '#6c757d'}`,
        className: isWin ? 'border-success' : (isLoss ? 'border-danger' : 'border-secondary')
      };
    }) || [];
  }

  /**
   * Handles modal close event
   * Encapsulates event emission for better maintainability
   */
  handleCloseModal(): void {
    this.closeModal.emit();
  }
}
