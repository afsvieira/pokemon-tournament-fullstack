import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TournamentComponent } from './tournament.component';
import { TournamentPokemon } from '../../models/tournament-pokemon.model';
import { BattleOutcome } from '../../models/battle-record.model';

/**
 * Unit tests for TournamentComponent.
 * Tests component initialization and how API errors are shown to the user.
 */
describe('TournamentComponent', () => {
  let component: TournamentComponent;
  let fixture: ComponentFixture<TournamentComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TournamentComponent, HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(TournamentComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  /**
   * Verifies component initializes correctly.
   */
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /**
   * Tests that component has default sort options.
   */
  it('should initialize with default sort options', () => {
    expect(component.currentSortBy).toBe('wins');
    expect(component.currentSortDirection).toBe('desc');
    expect(component.pokemonList).toEqual([]);
    expect(component.isLoading).toBeFalse();
  });

  /**
   * Verifies that a rate-limited response (429) shows a rate-limit message in the error toast.
   */
  it('should show a rate limit message when the API returns 429', () => {
    component.generateTournament();
    httpMock
      .expectOne(request => request.url.endsWith('/pokemon/tournament/statistics'))
      .flush(null, { status: 429, statusText: 'Too Many Requests' });
    fixture.detectChanges();

    const toastBody: HTMLElement = fixture.nativeElement.querySelector('.toast-body');
    expect(toastBody.textContent).toContain('Too many requests');
  });

  /**
   * Verifies that View Battles opens the Battle History modal as a dialog: assistive technology hears a dialog named
   * by its title, the close button has focus, Tab stays inside (the close button is its only focusable element),
   * Escape closes it and focus returns to View Battles.
   */
  it('should open the Battle History modal as a dialog that traps focus, closes on Escape and returns focus', () => {
    generateTournament();
    const page: HTMLElement = fixture.nativeElement;
    const viewBattles = page.querySelector<HTMLButtonElement>('app-pokemon-card button')!;

    viewBattles.focus();
    viewBattles.click();
    fixture.detectChanges();

    const dialog = page.querySelector<HTMLElement>('app-battle-history-modal [role="dialog"]')!;
    const closeButton = dialog.querySelector<HTMLButtonElement>('button.btn-close')!;
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(document.getElementById(dialog.getAttribute('aria-labelledby')!)?.textContent).toContain('Bulbasaur - Battle History');
    expect(document.activeElement).toBe(closeButton);
    expect(getComputedStyle(document.body).overflow).toBe('hidden');

    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    closeButton.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBeTrue();
    expect(document.activeElement).toBe(closeButton);

    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(page.querySelector('app-battle-history-modal')).toBeNull();
    expect(getComputedStyle(document.body).overflow).not.toBe('hidden');
    expect(document.activeElement).toBe(viewBattles);
  });

  /**
   * Verifies that "How do battles work?" opens the Tournament Rules modal as a dialog: assistive technology hears
   * a dialog named by its title, the close button has focus, Tab from the last button ("Got it!") lands on the close
   * button and Shift+Tab from the close button lands on "Got it!", Escape closes it and focus returns to the opener.
   */
  it('should open the Tournament Rules modal as a dialog that traps focus, closes on Escape and returns focus', () => {
    generateTournament();
    const page: HTMLElement = fixture.nativeElement;
    const rulesButton = page.querySelector<HTMLButtonElement>('button.btn-rules')!;

    rulesButton.focus();
    rulesButton.click();
    fixture.detectChanges();

    const dialog = page.querySelector<HTMLElement>('app-rules-modal [role="dialog"]')!;
    const closeButton = dialog.querySelector<HTMLButtonElement>('button.btn-close')!;
    const gotIt = dialog.querySelector<HTMLButtonElement>('.modal-footer button')!;
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(document.getElementById(dialog.getAttribute('aria-labelledby')!)?.textContent).toContain('Tournament Rules');
    expect(document.activeElement).toBe(closeButton);

    gotIt.focus();
    gotIt.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(document.activeElement).toBe(closeButton);
    closeButton.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }));
    expect(document.activeElement).toBe(gotIt);

    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(page.querySelector('app-rules-modal [role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(rulesButton);
  });

  /**
   * Generates a Tournament of one Pokémon with a battle record, so the cards and the Rules button are on the page.
   */
  function generateTournament(): void {
    const bulbasaur: TournamentPokemon = {
      id: 1,
      name: 'Bulbasaur',
      type: 'grass',
      baseExperience: 64,
      wins: 1,
      losses: 0,
      ties: 0,
      winRate: 100,
      battleRecords: [{ opponentName: 'Squirtle', opponentType: 'water', result: BattleOutcome.Win }]
    };
    component.generateTournament();
    httpMock
      .expectOne(request => request.url.endsWith('/pokemon/tournament/statistics'))
      .flush([bulbasaur]);
    fixture.detectChanges();
  }
});
