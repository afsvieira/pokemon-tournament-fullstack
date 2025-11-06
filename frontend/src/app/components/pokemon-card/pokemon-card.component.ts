import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TournamentPokemon } from '../../models/tournament-pokemon.model';
import { BattleHistoryModalComponent } from '../battle-history-modal/battle-history-modal.component';
import { Icons } from '../../models/icons.mapping';

@Component({
  selector: 'app-pokemon-card',
  standalone: true,
  imports: [CommonModule, BattleHistoryModalComponent],
  templateUrl: './pokemon-card.component.html',
  styleUrl: './pokemon-card.component.scss'
})
export class PokemonCardComponent {
  @Input({ required: true }) pokemon!: TournamentPokemon;
  showModal = false;

  openModal(): void {
    this.showModal = true;
  }

  getTypeIcon(type: string): string {
    return Icons[type.toLowerCase()] || 'fa-solid fa-question';
  }
}
