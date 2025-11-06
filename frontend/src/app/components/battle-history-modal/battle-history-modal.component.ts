import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TournamentPokemon } from '../../models/tournament-pokemon.model';
import { BattleOutcome, getBattleResultLabel, getBattleResultClass } from '../../models/battle-record.model';

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

  getBattleResultLabel = getBattleResultLabel;
  getBattleResultClass = getBattleResultClass;
  BattleOutcome = BattleOutcome;
}
