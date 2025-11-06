import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BattleHistoryModalComponent } from './battle-history-modal.component';
import { TournamentPokemon } from '../../models/tournament-pokemon.model';

/**
 * Unit tests for BattleHistoryModalComponent.
 * Tests modal functionality and battle history display.
 */
describe('BattleHistoryModalComponent', () => {
  let component: BattleHistoryModalComponent;
  let fixture: ComponentFixture<BattleHistoryModalComponent>;

  const mockPokemon: TournamentPokemon = {
    id: 1,
    name: 'Bulbasaur',
    type: 'grass',
    baseExperience: 64,
    wins: 5,
    losses: 3,
    ties: 2,
    winRate: 50.0,
    battleRecords: []
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BattleHistoryModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(BattleHistoryModalComponent);
    component = fixture.componentInstance;
    component.pokemon = mockPokemon;
    fixture.detectChanges();
  });

  /**
   * Verifies component initializes correctly with Pokemon data.
   */
  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.pokemon).toEqual(mockPokemon);
  });

  /**
   * Tests that modal displays Pokemon name in title.
   */
  it('should display Pokemon name in modal title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Bulbasaur - Battle History');
  });
});
