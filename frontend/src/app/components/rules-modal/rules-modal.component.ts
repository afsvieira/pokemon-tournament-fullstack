import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icons } from '../../models/icons.mapping';

@Component({
  selector: 'app-rules-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rules-modal.component.html',
  styleUrl: './rules-modal.component.scss'
})
export class RulesModalComponent {
  isVisible = false;

  typeMatchups = [
    { attacker: 'Water', attackerIcon: Icons['water'], attackerClass: 'water-icon', defender: 'Fire', defenderIcon: Icons['fire'], defenderClass: 'fire-icon' },
    { attacker: 'Fire', attackerIcon: Icons['fire'], attackerClass: 'fire-icon', defender: 'Grass', defenderIcon: Icons['grass'], defenderClass: 'grass-icon' },
    { attacker: 'Grass', attackerIcon: Icons['grass'], attackerClass: 'grass-icon', defender: 'Electric', defenderIcon: Icons['electric'], defenderClass: 'electric-icon' },
    { attacker: 'Electric', attackerIcon: Icons['electric'], attackerClass: 'electric-icon', defender: 'Water', defenderIcon: Icons['water'], defenderClass: 'water-icon' },
    { attacker: 'Ghost', attackerIcon: Icons['ghost'], attackerClass: 'ghost-icon', defender: 'Psychic', defenderIcon: Icons['psychic'], defenderClass: 'psychic-icon' },
    { attacker: 'Psychic', attackerIcon: Icons['psychic'], attackerClass: 'psychic-icon', defender: 'Fighting', defenderIcon: Icons['fighting'], defenderClass: 'fighting-icon' },
    { attacker: 'Fighting', attackerIcon: Icons['fighting'], attackerClass: 'fighting-icon', defender: 'Dark', defenderIcon: Icons['dark'], defenderClass: 'dark-icon' },
    { attacker: 'Dark', attackerIcon: Icons['dark'], attackerClass: 'dark-icon', defender: 'Ghost', defenderIcon: Icons['ghost'], defenderClass: 'ghost-icon' }
  ];

  open(): void {
    this.isVisible = true;
  }

  close(): void {
    this.isVisible = false;
  }
}
