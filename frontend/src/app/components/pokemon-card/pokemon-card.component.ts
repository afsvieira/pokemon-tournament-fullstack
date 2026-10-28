import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TournamentPokemon } from '../../models/tournament-pokemon.model';
import { BattleHistoryModalComponent } from '../battle-history-modal/battle-history-modal.component';
import { getTypeIconClass } from '../../models/icons.mapping';

@Component({
  selector: 'app-pokemon-card',
  standalone: true,
  imports: [CommonModule, BattleHistoryModalComponent],
  templateUrl: './pokemon-card.component.html',
  styleUrl: './pokemon-card.component.scss'
})
export class PokemonCardComponent {
  @Input({ required: true }) pokemon!: TournamentPokemon;
  /** Shows the "View Battles" button; round-by-round pages hide it, since their Round panel lists the Battles */
  @Input() showBattleHistory = true;
  showModal = false;

  openModal(): void {
    this.showModal = true;
  }

  getTypeIcon(type: string): string {
    return getTypeIconClass(type);
  }
}
