import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PokemonCardComponent } from './pokemon-card.component';
import { TournamentPokemon } from '../../models';

/**
 * Unit tests for PokemonCardComponent.
 * Tests component initialization, data binding, and user interactions.
 */
describe('PokemonCardComponent', () => {
  let component: PokemonCardComponent;
  let fixture: ComponentFixture<PokemonCardComponent>;

  const mockPokemon: TournamentPokemon = {
    id: 1,
    name: 'Bulbasaur',
    type: 'grass',
    baseExperience: 64,
    imageUrl: 'https://example.com/bulbasaur.png',
    wins: 5,
    losses: 3,
    ties: 2,
    winRate: 50.0,
    battleRecords: []
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PokemonCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PokemonCardComponent);
    component = fixture.componentInstance;
    component.pokemon = mockPokemon;
    fixture.detectChanges();
  });

  /**
   * Verifies component initializes correctly with required Pokemon input.
   */
  it('should create and initialize with Pokemon data', () => {
    expect(component).toBeTruthy();
    expect(component.pokemon).toEqual(mockPokemon);
    expect(component.showModal).toBeFalse();
  });

  /**
   * Tests that Pokemon data is correctly displayed in the template.
   */
  it('should display Pokemon information correctly', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    
    expect(compiled.textContent).toContain('Bulbasaur');
    expect(compiled.textContent).toContain('#001');
    expect(compiled.textContent).toContain('64 XP');
    expect(compiled.textContent).toContain('5'); // wins
    expect(compiled.textContent).toContain('3'); // losses
    expect(compiled.textContent).toContain('2'); // ties
    expect(compiled.textContent).toContain('50%'); // win rate
  });

  /**
   * Tests that clicking the "View Battles" button opens the modal.
   */
  it('should open modal when View Battles button is clicked', () => {
    const button = fixture.nativeElement.querySelector('button');
    
    button.click();
    
    expect(component.showModal).toBeTrue();
  });

  /**
   * Tests the getTypeIcon method returns correct Font Awesome classes.
   */
  it('should return correct type icons', () => {
    expect(component.getTypeIcon('fire')).toBe('fa-solid fa-fire');
    expect(component.getTypeIcon('water')).toBe('fa-solid fa-droplet');
    expect(component.getTypeIcon('grass')).toBe('fa-solid fa-leaf');
    expect(component.getTypeIcon('unknown')).toBe('fa-solid fa-question');
  });

  /**
   * Tests image display with fallback to placeholder.
   */
  it('should display image when imageUrl is provided', () => {
    const img = fixture.nativeElement.querySelector('img');
    expect(img).toBeTruthy();
    expect(img.src).toContain('bulbasaur.png');
    expect(img.alt).toBe('Bulbasaur');
  });

  /**
   * Tests fallback to emoji when no imageUrl is provided.
   */
  it('should show emoji placeholder when no imageUrl', () => {
    component.pokemon = { ...mockPokemon, imageUrl: undefined };
    fixture.detectChanges();
    
    const placeholder = fixture.nativeElement.querySelector('.fs-1');
    expect(placeholder?.textContent).toContain('🎴');
  });
});
