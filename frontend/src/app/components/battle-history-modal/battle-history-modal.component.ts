import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TournamentPokemon, getBattleResultString } from '../../models';

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

  getBattleResultString = getBattleResultString;
}
