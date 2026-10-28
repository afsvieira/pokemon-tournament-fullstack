import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
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

  /**
   * Verifies that a Tournament the API doesn't hold replaces the whole page with an explanation
   * and the two ways forward, instead of an error panel.
   */
  it('should show that the Tournament no longer exists when the API answers 404', async () => {
    const harness = await openGoneTournament();

    const page = harness.routeNativeElement!;
    expect(page.textContent).toContain('This Tournament no longer exists.');
    expect(page.textContent).toContain('Tournaments are kept in memory only until the API restarts.');
    expect(page.querySelector('.load-error')).toBeNull();
    expect(page.querySelectorAll('app-pokemon-card').length).toBe(0);
    expect(page.querySelector('.tournament-gone button.start-tournament')).not.toBeNull();
  });

  /**
   * Verifies that the Tournament History link on the "no longer exists" page opens the History page.
   */
  it('should open the Tournament History from the no-longer-exists page', async () => {
    const harness = await openGoneTournament();

    harness.routeNativeElement!.querySelector<HTMLAnchorElement>('.tournament-gone a')!.click();
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/round-by-round');
  });

  /**
   * Verifies that Start Tournament on the "no longer exists" page, reached here through a malformed id
   * (an empty-body 404), starts a new Tournament and shows it in place of the message.
   */
  it('should start a new Tournament from the no-longer-exists page', async () => {
    const newTournament = { ...createStartedTournament(), id: '9d8c7b6a-5f4e-4d3c-8b2a-1f0e9d8c7b6a' };
    const harness = await RouterTestingHarness.create('/round-by-round/not-a-guid');
    httpMock
      .expectOne({ method: 'GET', url: `${API_BASE_URL}/not-a-guid` })
      .flush(null, { status: 404, statusText: 'Not Found' });
    harness.detectChanges();

    harness.routeNativeElement!.querySelector<HTMLButtonElement>('.tournament-gone button.start-tournament')!.click();
    httpMock.expectOne({ method: 'POST', url: API_BASE_URL }).flush(newTournament);
    await harness.fixture.whenStable();
    harness.detectChanges();
    httpMock.expectOne({ method: 'GET', url: `${API_BASE_URL}/${newTournament.id}` }).flush(newTournament);
    harness.detectChanges();

    const page = harness.routeNativeElement!;
    expect(TestBed.inject(Router).url).toBe(`/round-by-round/${newTournament.id}`);
    expect(page.textContent).not.toContain('This Tournament no longer exists.');
    expect(page.querySelectorAll('app-pokemon-card').length).toBe(16);
  });

  async function openGoneTournament(): Promise<RouterTestingHarness> {
    const harness = await RouterTestingHarness.create(`/round-by-round/${tournament.id}`);
    httpMock
      .expectOne({ method: 'GET', url: tournamentUrl })
      .flush({ error: 'Tournament not found.' }, { status: 404, statusText: 'Not Found' });
    harness.detectChanges();
    return harness;
  }

  function firstCardName(harness: RouterTestingHarness): string {
    return harness.routeNativeElement!.querySelector('app-pokemon-card .fs-5')?.textContent?.trim() ?? '';
  }
});
