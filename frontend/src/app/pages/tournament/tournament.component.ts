import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TournamentPokemon, SortBy, SortDirection, SortOptions } from '../../models';
import { TournamentService } from '../../services/tournament.service';
import { PokemonCardComponent } from '../../components/pokemon-card/pokemon-card.component';
import { SortControlsComponent } from '../../components/sort-controls/sort-controls.component';
import { RulesModalComponent } from '../../components/rules-modal/rules-modal.component';

@Component({
  selector: 'app-tournament',
  imports: [CommonModule, PokemonCardComponent, SortControlsComponent, RulesModalComponent],
  standalone: true,
  templateUrl: './tournament.component.html',
  styleUrl: './tournament.component.scss'
})
export class TournamentComponent {
  @ViewChild(RulesModalComponent) rulesModal!: RulesModalComponent;

  pokemonList: TournamentPokemon[] = [];
  isLoading = false;
  currentSortBy: SortBy = 'wins';
  currentSortDirection: SortDirection = 'desc';

  constructor(private tournamentService: TournamentService) {}

  /**
   * Opens the rules modal
   */
  openRulesModal(): void {
    this.rulesModal.open();
  }

  /**
   * Generates tournament statistics by calling the API
   */
  generateTournament(): void {
    this.isLoading = true;

    this.tournamentService.getTournamentStatistics(this.currentSortBy, this.currentSortDirection)
      .subscribe({
        next: (pokemon) => {
          this.pokemonList = pokemon;
          this.sortPokemonList();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error generating tournament:', error);
          this.isLoading = false;
        }
      });
  }

  /**
   * Handles sort change from sort controls component
   */
  onSortChange(sortOptions: SortOptions): void {
    this.currentSortBy = sortOptions.sortBy;
    this.currentSortDirection = sortOptions.sortDirection;

    // Sort existing data locally
    if (this.pokemonList.length > 0) {
      this.sortPokemonList();
    }
  }

  /**
   * Sorts the current pokemon list locally
   */
  private sortPokemonList(): void {
    this.pokemonList.sort((a, b) => {
      let valueA: any = a[this.currentSortBy];
      let valueB: any = b[this.currentSortBy];

      // Handle string comparison for name
      if (this.currentSortBy === 'name') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }

      let comparison = 0;
      if (valueA > valueB) {
        comparison = 1;
      } else if (valueA < valueB) {
        comparison = -1;
      }

      return this.currentSortDirection === 'desc' ? -comparison : comparison;
    });
  }
}
