import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { Round } from '../../models/round.model';
import { Battle } from '../../models/battle.model';
import { getTypeIconClass } from '../../models/icons.mapping';
import { getBattleResultClass, getBattleResultLabel } from '../../shared/battle-result';

@Component({
  selector: 'app-round-panel',
  standalone: true,
  imports: [NgClass, NgTemplateOutlet],
  templateUrl: './round-panel.component.html',
  styleUrl: './round-panel.component.scss'
})
export class RoundPanelComponent {
  /** The Round to show; null before Round 1 */
  @Input() round: Round | null = null;
  /** Emitted with the Battle's id when its row is clicked, so the page can open it */
  @Output() battleSelected = new EventEmitter<number>();

  /**
   * The Battle's result, e.g. "Pikachu wins" or "Tie"
   */
  getResultLabel(battle: Battle): string {
    return getBattleResultLabel(battle);
  }

  /**
   * Colours a win green and a tie grey
   */
  getResultClass(battle: Battle): string {
    return getBattleResultClass(battle);
  }

  /**
   * Asks the page to open the clicked Battle
   */
  selectBattle(battle: Battle): void {
    this.battleSelected.emit(battle.id);
  }

  getTypeIcon(type: string): string {
    return getTypeIconClass(type);
  }
}
