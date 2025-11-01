import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

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
    { attacker: 'Water', attackerIcon: 'fa-droplet', attackerClass: 'water-icon', defender: 'Fire', defenderIcon: 'fa-fire', defenderClass: 'fire-icon' },
    { attacker: 'Fire', attackerIcon: 'fa-fire', attackerClass: 'fire-icon', defender: 'Grass', defenderIcon: 'fa-leaf', defenderClass: 'grass-icon' },
    { attacker: 'Grass', attackerIcon: 'fa-leaf', attackerClass: 'grass-icon', defender: 'Electric', defenderIcon: 'fa-bolt', defenderClass: 'electric-icon' },
    { attacker: 'Electric', attackerIcon: 'fa-bolt', attackerClass: 'electric-icon', defender: 'Water', defenderIcon: 'fa-droplet', defenderClass: 'water-icon' },
    { attacker: 'Ghost', attackerIcon: 'fa-ghost', attackerClass: 'ghost-icon', defender: 'Psychic', defenderIcon: 'fa-brain', defenderClass: 'psychic-icon' },
    { attacker: 'Psychic', attackerIcon: 'fa-brain', attackerClass: 'psychic-icon', defender: 'Fighting', defenderIcon: 'fa-hand-fist', defenderClass: 'fighting-icon' },
    { attacker: 'Fighting', attackerIcon: 'fa-hand-fist', attackerClass: 'fighting-icon', defender: 'Dark', defenderIcon: 'fa-moon', defenderClass: 'dark-icon' },
    { attacker: 'Dark', attackerIcon: 'fa-moon', attackerClass: 'dark-icon', defender: 'Ghost', defenderIcon: 'fa-ghost', defenderClass: 'ghost-icon' }
  ];

  open(): void {
    this.isVisible = true;
  }

  close(): void {
    this.isVisible = false;
  }
}
