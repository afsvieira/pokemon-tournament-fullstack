import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { API_BASE_URL } from '../../services/api-base-url';
import { createStartedTournament } from '../../testing/test-tournament';

/**
 * Tests for the Tournament History page, rendered through the app routes with the real RoundByRoundService.
 */
describe('TournamentHistoryComponent', () => {
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
    const harness = await RouterTestingHarness.create('/round-by-round');
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
    const harness = await RouterTestingHarness.create('/round-by-round');
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

  function getStartButton(harness: RouterTestingHarness): HTMLButtonElement {
    return harness.routeNativeElement!.querySelector('button.start-tournament')!;
  }
});
