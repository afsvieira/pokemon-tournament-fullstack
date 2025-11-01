import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TournamentPokemon } from '../../models';
import { BattleHistoryModalComponent } from '../battle-history-modal/battle-history-modal.component';

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
    const icons: { [key: string]: string } = {
      fire: 'fa-solid fa-fire',
      water: 'fa-solid fa-droplet',
      grass: 'fa-solid fa-leaf',
      electric: 'fa-solid fa-bolt',
      psychic: 'fa-solid fa-brain',
      fighting: 'fa-solid fa-hand-fist',
      dark: 'fa-solid fa-moon',
      ghost: 'fa-solid fa-ghost',
      normal: 'fa-solid fa-circle',
      flying: 'fa-solid fa-feather',
      poison: 'fa-solid fa-skull-crossbones',
      ground: 'fa-solid fa-mountain',
      rock: 'fa-solid fa-gem',
      bug: 'fa-solid fa-bug',
      steel: 'fa-solid fa-gears',
      ice: 'fa-solid fa-snowflake',
      dragon: 'fa-solid fa-dragon',
      fairy: 'fa-solid fa-wand-sparkles'
    };
    return icons[type.toLowerCase()] || 'fa-solid fa-question';
  }
}
