import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'frontend';
  isDarkTheme = true;

  /**
   * Toggles between dark and light theme
   */
  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    this.applyTheme();
  }

  /**
   * Applies theme to document body
   */
  private applyTheme(): void {
    document.body.setAttribute('data-bs-theme', this.isDarkTheme ? 'dark' : 'light');
  }

  ngOnInit(): void {
    this.applyTheme();
  }
}
