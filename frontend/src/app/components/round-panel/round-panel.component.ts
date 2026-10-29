import { Component, ElementRef, EventEmitter, Injector, Input, OnChanges, Output, SimpleChanges, ViewChild, afterNextRender, inject } from '@angular/core';
import { NgClass, NgTemplateOutlet, TitleCasePipe } from '@angular/common';
import { Round } from '../../models/round.model';
import { Battle } from '../../models/battle.model';
import { BattlePokemon } from '../../models/battle-pokemon.model';
import { getTypeIconClass } from '../../models/icons.mapping';
import { getBattleResultLabel, isBattleTie, isBattleWinner } from '../../shared/battle-result';

@Component({
  selector: 'app-round-panel',
  standalone: true,
  imports: [NgClass, NgTemplateOutlet, TitleCasePipe],
  templateUrl: './round-panel.component.html',
  styleUrl: './round-panel.component.scss'
})
export class RoundPanelComponent implements OnChanges {
  /** The Round to show; null before Round 1 */
  @Input() round: Round | null = null;
  /** The Round just played by Process Round: its heading takes focus and the panel pulses once; null otherwise */
  @Input() justProcessedRound: number | null = null;
  /** Whether the panel is pulsing for a just processed Round; cleared when the pulse ends */
  isPulsing = false;

  @ViewChild('heading') private heading?: ElementRef<HTMLElement>;
  private readonly injector = inject(Injector);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['justProcessedRound'] && this.justProcessedRound !== null) {
      this.isPulsing = true;
      // The heading exists once the Round is rendered, so focus follows the render
      afterNextRender(() => this.heading?.nativeElement.focus(), { injector: this.injector });
    }
  }
  /** Emitted with the Battle's id when its row is clicked, so the page can open it */
  @Output() battleSelected = new EventEmitter<number>();

  /**
   * The row's accessible name, the whole result in one go: "Battle 33, Alakazam vs Slowbro, Alakazam wins"
   */
  getRowLabel(battle: Battle): string {
    return `Battle ${battle.id}, ${battle.pokemon1.name} vs ${battle.pokemon2.name}, ${getBattleResultLabel(battle)}`;
  }

  /**
   * Whether the Battle ended in a tie, so the centre marker reads "Tie" instead of "vs"
   */
  isTie(battle: Battle): boolean {
    return isBattleTie(battle);
  }

  /**
   * Whether this Pokémon won the Battle, so its name is marked in place
   */
  isWinner(battle: Battle, pokemon: BattlePokemon): boolean {
    return isBattleWinner(battle, pokemon);
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
