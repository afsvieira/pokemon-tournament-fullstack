import { Component, Input } from '@angular/core';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { Round } from '../../models/round.model';
import { Battle } from '../../models/battle.model';
import { getTypeIconClass } from '../../models/icons.mapping';

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

  /**
   * The Battle's result, e.g. "Pikachu wins" or "Tie"
   */
  getResultLabel(battle: Battle): string {
    if (this.isTie(battle)) {
      return 'Tie';
    }
    const winner = battle.winnerId === battle.pokemon1.id ? battle.pokemon1 : battle.pokemon2;
    return `${winner.name} wins`;
  }

  /**
   * Colours a win green and a tie grey
   */
  getResultClass(battle: Battle): string {
    return this.isTie(battle) ? 'text-secondary' : 'text-success';
  }

  getTypeIcon(type: string): string {
    return getTypeIconClass(type);
  }

  private isTie(battle: Battle): boolean {
    return battle.winnerId === null;
  }
}
