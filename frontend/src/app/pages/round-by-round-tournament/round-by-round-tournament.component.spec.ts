import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { API_BASE_URL } from '../../services/api-base-url';
import { createStartedTournament } from '../../testing/test-tournament';

/**
 * Tests for the Tournament page, rendered through the app routes with the real RoundByRoundService.
 */
describe('RoundByRoundTournamentComponent', () => {
  const tournament = createStartedTournament();
  const tournamentUrl = `${API_BASE_URL}/${tournament.id}`;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()]
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  /**
   * Verifies that a just-started Tournament shows its 16 Pokémon at 0 wins, losses and ties,
   * Round 0 of 15, an empty Round panel, and no "View Battles" buttons on the cards.
   */
  it('should show the 16 Pokémon without View Battles when the Tournament has no Rounds yet', async () => {
    const harness = await RouterTestingHarness.create(`/round-by-round/${tournament.id}`);

    httpMock.expectOne({ method: 'GET', url: tournamentUrl }).flush(tournament);
    harness.detectChanges();

    const page = harness.routeNativeElement!;
    expect(page.querySelectorAll('app-pokemon-card').length).toBe(16);
    expect(page.textContent).toContain('Round 0 of 15');
    expect(page.textContent).toContain('No Rounds yet');
    expect(page.textContent).not.toContain('View Battles');
    expect(page.querySelector('a[href="/round-by-round"]')?.textContent).toContain('Tournament History');
  });

  /**
   * Verifies that the cards are sorted by wins descending by default, and re-sorted locally,
   * without another request, when the sort direction is toggled.
   */
  it('should sort the cards locally, by wins descending by default', async () => {
    const standings = tournament.standings.map((pokemon, index) => ({ ...pokemon, wins: index }));
    const harness = await RouterTestingHarness.create(`/round-by-round/${tournament.id}`);
    httpMock.expectOne({ method: 'GET', url: tournamentUrl }).flush({ ...tournament, standings });
    harness.detectChanges();

    expect(firstCardName(harness)).toBe('Pokemon16');

    harness.routeNativeElement!.querySelector<HTMLButtonElement>('.sort-direction-btn')!.click();
    harness.detectChanges();

    expect(firstCardName(harness)).toBe('Pokemon1');
  });

  /**
   * Verifies that a Tournament that fails to load shows the error in an inline panel instead of the page,
   * and that Retry loads the Tournament again.
   */
  it('should show an inline panel with Retry when loading fails, and reload on Retry', async () => {
    const harness = await RouterTestingHarness.create(`/round-by-round/${tournament.id}`);
    httpMock.expectOne({ method: 'GET', url: tournamentUrl }).flush(null, { status: 500, statusText: 'Server Error' });
    harness.detectChanges();

    const page = harness.routeNativeElement!;
    expect(page.querySelector('.load-error')?.textContent).toContain('Server error occurred. Please try again later.');
    expect(page.querySelectorAll('app-pokemon-card').length).toBe(0);

    page.querySelector<HTMLButtonElement>('.load-error button')!.click();
    httpMock.expectOne({ method: 'GET', url: tournamentUrl }).flush(tournament);
    harness.detectChanges();

    expect(page.querySelector('.load-error')).toBeNull();
    expect(page.querySelectorAll('app-pokemon-card').length).toBe(16);
  });

  function firstCardName(harness: RouterTestingHarness): string {
    return harness.routeNativeElement!.querySelector('app-pokemon-card .fs-5')?.textContent?.trim() ?? '';
  }
});
