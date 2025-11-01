import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TournamentComponent } from './tournament.component';

/**
 * Unit tests for TournamentComponent.
 * Tests component initialization and basic functionality.
 */
describe('TournamentComponent', () => {
  let component: TournamentComponent;
  let fixture: ComponentFixture<TournamentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TournamentComponent, HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(TournamentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
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
});
