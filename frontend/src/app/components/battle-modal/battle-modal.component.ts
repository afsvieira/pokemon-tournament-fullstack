import { Component, DestroyRef, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgClass, NgTemplateOutlet, TitleCasePipe } from '@angular/common';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Battle } from '../../models/battle.model';
import { BattlePokemon } from '../../models/battle-pokemon.model';
import { getTypeIconClass } from '../../models/icons.mapping';
import { RoundByRoundService } from '../../services/round-by-round.service';
import { getBattleResultLabel, isBattleWinner } from '../../shared/battle-result';
import { getErrorMessage } from '../../shared/error-message';

@Component({
  selector: 'app-battle-modal',
  standalone: true,
  imports: [NgClass, NgTemplateOutlet, TitleCasePipe],
  templateUrl: './battle-modal.component.html',
  styleUrl: './battle-modal.component.scss'
})
export class BattleModalComponent implements OnInit {
  /** The id of the Tournament the Battle belongs to */
  @Input({ required: true }) tournamentId!: string;
  /** The Battle's number within the Tournament, 1 to 120 */
  @Input({ required: true }) battleId!: number;
  @Output() closeModal = new EventEmitter<void>();
  /** Emitted when the API answers 404, so the page can show that the Tournament no longer exists */
  @Output() tournamentGone = new EventEmitter<void>();

  battle: Battle | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(
    private roundByRoundService: RoundByRoundService,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    // Closing the modal mid-request drops the answer, so a closed modal never reacts to it
    this.roundByRoundService.getBattle(this.tournamentId, this.battleId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (battle) => {
          this.battle = battle;
          this.isLoading = false;
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading = false;
          if (error.status === HttpStatusCode.NotFound) {
            this.tournamentGone.emit();
          } else {
            this.errorMessage = getErrorMessage(error);
          }
        }
      });
  }

  /**
   * The Battle's result, e.g. "Pikachu wins" or "Tie"
   */
  get resultLabel(): string {
    return this.battle ? getBattleResultLabel(this.battle) : '';
  }

  /**
   * Whether this Pokémon won the Battle, so its card is outlined in green and its name marked as in the Round panel
   */
  isWinner(pokemon: BattlePokemon): boolean {
    return this.battle !== null && isBattleWinner(this.battle, pokemon);
  }

  /**
   * Outlines the winner's side in green, and both sides in grey on a tie
   */
  getFighterClass(pokemon: BattlePokemon): string {
    return this.isWinner(pokemon) ? 'border-success' : 'border-secondary';
  }

  getTypeIcon(type: string): string {
    return getTypeIconClass(type);
  }

  /**
   * Handles modal close event
   */
  handleCloseModal(): void {
    this.closeModal.emit();
  }
}
