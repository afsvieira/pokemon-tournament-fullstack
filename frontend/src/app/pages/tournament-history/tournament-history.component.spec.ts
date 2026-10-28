import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { API_BASE_URL } from '../../services/api-base-url';
import { createStartedTournament } from '../../testing/test-tournament';
import { TournamentHistoryEntry } from '../../models/tournament-history-entry.model';

/**
 * Tests for the Tournament History page, rendered through the app routes with the real RoundByRoundService.
 */
describe('TournamentHistoryComponent', () => {
  const historyUrl = `${API_BASE_URL}/history`;
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
   * Verifies that Start Tournament shows a spinner while the request runs, then opens the new Tournament's page.
   */
  it('should open the new Tournament page when Start succeeds', async () => {
    const harness = await openHistoryPage([]);
    const tournament = createStartedTournament();
    const startButton = getStartButton(harness);

    startButton.click();
    harness.detectChanges();

    expect(startButton.disabled).toBeTrue();
    expect(startButton.querySelector('.spinner-border')).not.toBeNull();

    httpMock.expectOne({ method: 'POST', url: API_BASE_URL }).flush(tournament);
    await harness.fixture.whenStable();
    harness.detectChanges();

    expect(TestBed.inject(Router).url).toBe(`/round-by-round/${tournament.id}`);
    httpMock.expectOne({ method: 'GET', url: `${API_BASE_URL}/${tournament.id}` }).flush(tournament);
  });

  /**
   * Verifies that a failed Start shows the API's error message in a toast, stays on the page
   * and enables Start Tournament again.
   */
  it('should show the API message in a toast and enable Start again when Start fails', async () => {
    const harness = await openHistoryPage([]);
    const startButton = getStartButton(harness);
    const apiMessage = 'Could not start a tournament right now. Try again later.';

    startButton.click();
    httpMock
      .expectOne({ method: 'POST', url: API_BASE_URL })
      .flush({ error: apiMessage }, { status: 502, statusText: 'Bad Gateway' });
    harness.detectChanges();

    expect(harness.routeNativeElement!.querySelector('.toast-body')?.textContent).toContain(apiMessage);
    expect(startButton.disabled).toBeFalse();
    expect(TestBed.inject(Router).url).toBe('/round-by-round');
  });

  /**
   * Verifies that the History lists each Tournament with its local start time and the Rounds it has played,
   * marked when Complete, and that Open goes to that Tournament's page.
   */
  it('should list the Tournaments and open one of them', async () => {
    const tournament = createStartedTournament();
    const history: TournamentHistoryEntry[] = [
      { id: '9d8c7b6a-5f4e-4d3c-8b2a-1f0e9d8c7b6a', startedAt: '2026-10-28T12:30:00+00:00', roundsPlayed: 15 },
      { id: tournament.id, startedAt: '2026-10-28T12:00:00+00:00', roundsPlayed: 7 }
    ];
    const harness = await openHistoryPage(history);

    const rows = harness.routeNativeElement!.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain(localDateTime(history[0].startedAt));
    expect(rows[0].textContent).toContain('15/15 ✔');
    expect(rows[1].textContent).toContain(localDateTime(history[1].startedAt));
    expect(rows[1].textContent).toContain('7/15');
    expect(rows[1].textContent).not.toContain('✔');

    rows[1].querySelector<HTMLAnchorElement>('a.open-tournament')!.click();
    await harness.fixture.whenStable();
    harness.detectChanges();

    expect(TestBed.inject(Router).url).toBe(`/round-by-round/${tournament.id}`);
    httpMock.expectOne({ method: 'GET', url: `${API_BASE_URL}/${tournament.id}` }).flush(tournament);
  });

  /**
   * Verifies that an empty History says no Tournaments exist since the API last started, instead of an empty table.
   */
  it('should show the empty state when there are no Tournaments', async () => {
    const harness = await openHistoryPage([]);

    const page = harness.routeNativeElement!;
    expect(page.textContent).toContain('No Tournaments since the API last started.');
    expect(page.querySelector('table')).toBeNull();
  });

  /**
   * Verifies that a History that fails to load shows the error in an inline panel, never an empty table or the
   * empty state, and that Retry loads the History again.
   */
  it('should show an inline panel with Retry when the History fails to load, and reload on Retry', async () => {
    const harness = await RouterTestingHarness.create('/round-by-round');
    httpMock.expectOne({ method: 'GET', url: historyUrl }).flush(null, { status: 500, statusText: 'Server Error' });
    harness.detectChanges();

    const page = harness.routeNativeElement!;
    expect(page.querySelector('.load-error')?.textContent).toContain('Server error occurred. Please try again later.');
    expect(page.querySelector('table')).toBeNull();
    expect(page.textContent).not.toContain('No Tournaments since the API last started.');

    page.querySelector<HTMLButtonElement>('.load-error button')!.click();
    httpMock
      .expectOne({ method: 'GET', url: historyUrl })
      .flush([{ id: createStartedTournament().id, startedAt: '2026-10-28T12:00:00+00:00', roundsPlayed: 3 }]);
    harness.detectChanges();

    expect(page.querySelector('.load-error')).toBeNull();
    expect(page.querySelectorAll('tbody tr').length).toBe(1);
  });

  /**
   * Opens the History page and answers its History request.
   */
  async function openHistoryPage(history: TournamentHistoryEntry[]): Promise<RouterTestingHarness> {
    const harness = await RouterTestingHarness.create('/round-by-round');
    httpMock.expectOne({ method: 'GET', url: historyUrl }).flush(history);
    harness.detectChanges();
    return harness;
  }

  /**
   * Writes a UTC timestamp as the browser's local "dd/MM/yyyy HH:mm"
   */
  function localDateTime(utcTimestamp: string): string {
    const date = new Date(utcTimestamp);
    const pad = (value: number) => `${value}`.padStart(2, '0');
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} `
      + `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function getStartButton(harness: RouterTestingHarness): HTMLButtonElement {
    return harness.routeNativeElement!.querySelector('button.start-tournament')!;
  }
});
