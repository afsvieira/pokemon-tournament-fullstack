import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TournamentComponent } from './tournament.component';

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
});
