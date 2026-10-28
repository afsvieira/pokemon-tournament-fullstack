import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { API_BASE_URL } from '../../services/api-base-url';
import { createProcessedRound, createRound, createStartedTournament } from '../../testing/test-tournament';
import { Tournament } from '../../models/tournament.model';

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

  /**
   * Verifies that Process Round shows the new Round's 8 Battles with their results,
   * moves the header to "Round 1 of 15" and updates the cards from the returned Standings.
   */
  it('should show the Round and update the cards when Process Round succeeds', async () => {
    const harness = await RouterTestingHarness.create(`/round-by-round/${tournament.id}`);
    httpMock.expectOne({ method: 'GET', url: tournamentUrl }).flush(tournament);
    harness.detectChanges();
    const page = harness.routeNativeElement!;
    expect(cardWins(page, 'Pokemon1')).toBe('0');

    page.querySelector<HTMLButtonElement>('button.process-round')!.click();
    httpMock.expectOne({ method: 'POST', url: `${tournamentUrl}/rounds` }).flush(createProcessedRound(1));
    harness.detectChanges();

    const battleRows = page.querySelectorAll('.battle-row');
    expect(battleRows.length).toBe(8);
    expect(battleRows[0].textContent).toContain('Battle 1');
    expect(battleRows[0].textContent).toContain('Pokemon1');
    expect(battleRows[0].textContent).toContain('50 XP');
    expect(battleRows[0].textContent).toContain('Pokemon2');
    expect(battleRows[0].textContent).toContain('51 XP');
    expect(battleRows[0].querySelectorAll('i.fa-circle').length).toBe(2);
    expect(battleRows[0].textContent).toContain('Pokemon1 wins');
    expect(battleRows[2].textContent).toContain('Tie');
    expect(page.textContent).toContain('Round 1 of 15');
    expect(page.textContent).not.toContain('No Rounds yet');
    expect(cardWins(page, 'Pokemon1')).toBe('1');
  });

  /**
   * Verifies that Process Round is disabled with a spinner while its request runs,
   * and that the Complete badge replaces it once Round 15 is played.
   */
  it('should disable Process Round while in flight, and show the Complete badge after Round 15', async () => {
    const harness = await openTournamentPage({ ...tournament, roundsPlayed: 14 });
    const page = harness.routeNativeElement!;
    const processButton = page.querySelector<HTMLButtonElement>('button.process-round')!;

    processButton.click();
    harness.detectChanges();

    expect(processButton.disabled).toBeTrue();
    expect(processButton.querySelector('.spinner-border')).not.toBeNull();

    httpMock.expectOne({ method: 'POST', url: `${tournamentUrl}/rounds` }).flush(createProcessedRound(15));
    harness.detectChanges();

    expect(page.textContent).toContain('Round 15 of 15');
    expect(page.querySelector('.complete-badge')?.textContent).toContain('✔ Complete');
    expect(page.querySelector('button.process-round')).toBeNull();
  });

  /**
   * Verifies that opening a Tournament with Rounds played also loads and shows its last Round.
   */
  it('should show the last played Round when the page loads', async () => {
    const harness = await openTournamentPage({ ...tournament, roundsPlayed: 3 });
    const page = harness.routeNativeElement!;

    expect(page.textContent).toContain('Round 3 of 15');
    expect(page.querySelector('app-round-panel')?.textContent).toContain('Round 3');
    expect(page.querySelector('.battle-row')?.textContent).toContain('Battle 17');
  });

  /**
   * Verifies that a failed Process Round shows a toast, leaves the page as it was and enables the button again.
   */
  it('should show a toast and keep the page when Process Round fails', async () => {
    const harness = await openTournamentPage(tournament);
    const page = harness.routeNativeElement!;

    page.querySelector<HTMLButtonElement>('button.process-round')!.click();
    httpMock
      .expectOne({ method: 'POST', url: `${tournamentUrl}/rounds` })
      .flush(null, { status: 500, statusText: 'Server Error' });
    harness.detectChanges();

    expect(page.querySelector('.toast-body')?.textContent).toContain('Server error occurred. Please try again later.');
    expect(page.textContent).toContain('Round 0 of 15');
    expect(page.textContent).toContain('No Rounds yet');
    expect(page.querySelector<HTMLButtonElement>('button.process-round')!.disabled).toBeFalse();
  });

  /**
   * Verifies that a 409 from Process Round, as in a stale tab whose Tournament another tab completed,
   * reloads the Tournament and its last Round, then shows the API's message in a toast.
   */
  it('should reload the Tournament and show the API message when Process Round answers 409', async () => {
    const harness = await openTournamentPage({ ...tournament, roundsPlayed: 14 });
    const page = harness.routeNativeElement!;

    page.querySelector<HTMLButtonElement>('button.process-round')!.click();
    httpMock
      .expectOne({ method: 'POST', url: `${tournamentUrl}/rounds` })
      .flush({ error: 'Tournament is already complete.' }, { status: 409, statusText: 'Conflict' });
    harness.detectChanges();

    expect(page.querySelector('.toast-body')).toBeNull();

    httpMock.expectOne({ method: 'GET', url: tournamentUrl }).flush({ ...tournament, roundsPlayed: 15 });
    httpMock.expectOne({ method: 'GET', url: `${tournamentUrl}/rounds/15` }).flush(createRound(15));
    harness.detectChanges();

    expect(page.textContent).toContain('Round 15 of 15');
    expect(page.querySelector('.complete-badge')).not.toBeNull();
    expect(page.querySelector('.toast-body')?.textContent).toContain('Tournament is already complete.');
  });

  /**
   * Verifies that a 404 from Process Round, as after an API restart, shows that the Tournament no longer exists.
   */
  it('should show that the Tournament no longer exists when Process Round answers 404', async () => {
    const harness = await openTournamentPage(tournament);
    const page = harness.routeNativeElement!;

    page.querySelector<HTMLButtonElement>('button.process-round')!.click();
    httpMock
      .expectOne({ method: 'POST', url: `${tournamentUrl}/rounds` })
      .flush({ error: 'Tournament not found.' }, { status: 404, statusText: 'Not Found' });
    harness.detectChanges();

    expect(page.textContent).toContain('This Tournament no longer exists.');
    expect(page.querySelector('.toast-body')).toBeNull();
  });

  /**
   * Verifies that the page shows one chip per Round, with only the played ones enabled and the last one selected,
   * that a chip shows its Round while the header and cards stay current, and that each Round is fetched only once.
   */
  it('should select played Rounds with the chips, fetching each Round only once', async () => {
    const harness = await openTournamentPage({ ...tournament, roundsPlayed: 3 });
    const page = harness.routeNativeElement!;
    const chips = Array.from(page.querySelectorAll<HTMLButtonElement>('button.round-chip'));

    expect(chips.map((chip) => chip.textContent?.trim())).toEqual(
      Array.from({ length: 15 }, (_, index) => `${index + 1}`));
    expect(chips.map((chip) => chip.disabled)).toEqual(
      Array.from({ length: 15 }, (_, index) => index >= 3));
    expect(selectedChip(page)).toBe('3');

    chips[0].click();
    httpMock.expectOne({ method: 'GET', url: `${tournamentUrl}/rounds/1` }).flush(createRound(1));
    harness.detectChanges();

    expect(selectedChip(page)).toBe('1');
    expect(page.querySelector('.battle-row')?.textContent).toContain('Battle 1');
    expect(page.textContent).toContain('Round 3 of 15');
    expect(page.querySelectorAll('app-pokemon-card').length).toBe(16);

    chips[2].click();
    harness.detectChanges();
    chips[0].click();
    harness.detectChanges();

    httpMock.expectNone(`${tournamentUrl}/rounds/1`);
    httpMock.expectNone(`${tournamentUrl}/rounds/3`);
    expect(selectedChip(page)).toBe('1');
    expect(page.querySelector('.battle-row')?.textContent).toContain('Battle 1');
  });

  /**
   * Verifies that Process Round selects and shows the Round it played, even while an earlier Round was selected.
   */
  it('should select the newest Round after Process Round', async () => {
    const harness = await openTournamentPage({ ...tournament, roundsPlayed: 2 });
    const page = harness.routeNativeElement!;
    page.querySelectorAll<HTMLButtonElement>('button.round-chip')[0].click();
    httpMock.expectOne({ method: 'GET', url: `${tournamentUrl}/rounds/1` }).flush(createRound(1));
    harness.detectChanges();

    page.querySelector<HTMLButtonElement>('button.process-round')!.click();
    httpMock.expectOne({ method: 'POST', url: `${tournamentUrl}/rounds` }).flush(createProcessedRound(3));
    harness.detectChanges();

    expect(selectedChip(page)).toBe('3');
    expect(page.querySelector('.battle-row')?.textContent).toContain('Battle 17');
    expect(page.querySelectorAll<HTMLButtonElement>('button.round-chip')[2].disabled).toBeFalse();
  });

  /**
   * Verifies that a chip's Round still loading when Process Round succeeds is dropped,
   * so its late answer can't replace the newest Round.
   */
  it('should keep the newest Round selected when Process Round succeeds while a chip is still loading', async () => {
    const harness = await openTournamentPage({ ...tournament, roundsPlayed: 2 });
    const page = harness.routeNativeElement!;
    page.querySelectorAll<HTMLButtonElement>('button.round-chip')[0].click();
    const chipRequest = httpMock.expectOne({ method: 'GET', url: `${tournamentUrl}/rounds/1` });

    page.querySelector<HTMLButtonElement>('button.process-round')!.click();
    httpMock.expectOne({ method: 'POST', url: `${tournamentUrl}/rounds` }).flush(createProcessedRound(3));
    harness.detectChanges();

    expect(chipRequest.cancelled).toBeTrue();
    expect(selectedChip(page)).toBe('3');
  });

  /**
   * Verifies that a chip whose Round fails to load shows a toast and leaves the selected Round as it was.
   */
  it('should show a toast and keep the selected Round when a chip fails to load its Round', async () => {
    const harness = await openTournamentPage({ ...tournament, roundsPlayed: 3 });
    const page = harness.routeNativeElement!;

    page.querySelectorAll<HTMLButtonElement>('button.round-chip')[0].click();
    httpMock
      .expectOne({ method: 'GET', url: `${tournamentUrl}/rounds/1` })
      .flush(null, { status: 500, statusText: 'Server Error' });
    harness.detectChanges();

    expect(page.querySelector('.toast-body')?.textContent).toContain('Server error occurred. Please try again later.');
    expect(selectedChip(page)).toBe('3');
    expect(page.querySelector('.battle-row')?.textContent).toContain('Battle 17');
  });

  /**
   * Verifies that clicking a Battle row opens a modal that fetches the Battle and shows both Pokémon,
   * with image, type and base experience, and the winner; and that the modal closes.
   */
  it('should open a Battle in a modal with both Pokémon and the winner', async () => {
    const harness = await openTournamentPage({ ...tournament, roundsPlayed: 3 });
    const page = harness.routeNativeElement!;

    page.querySelector<HTMLElement>('.battle-row')!.click();
    harness.detectChanges();
    httpMock.expectOne({ method: 'GET', url: `${tournamentUrl}/battles/17` }).flush(createRound(3).battles[0]);
    harness.detectChanges();

    const modal = page.querySelector('app-battle-modal')!;
    expect(modal.textContent).toContain('Battle 17');
    expect(Array.from(modal.querySelectorAll('img')).map((image) => image.getAttribute('src'))).toEqual([
      'https://img.example/1.png',
      'https://img.example/2.png'
    ]);
    expect(modal.textContent).toContain('Pokemon1');
    expect(modal.textContent).toContain('50 XP');
    expect(modal.textContent).toContain('Pokemon2');
    expect(modal.textContent).toContain('51 XP');
    expect(modal.textContent).toContain('Normal');
    expect(modal.querySelector('.battle-result')?.textContent).toContain('Pokemon1 wins');

    modal.querySelector<HTMLButtonElement>('button.btn-close')!.click();
    harness.detectChanges();

    expect(page.querySelector('app-battle-modal')).toBeNull();
  });

  /**
   * Verifies that the modal of a tied Battle shows "Tie" instead of a winner.
   */
  it('should show Tie in the Battle modal when the Battle is a tie', async () => {
    const harness = await openTournamentPage({ ...tournament, roundsPlayed: 3 });
    const page = harness.routeNativeElement!;

    page.querySelectorAll<HTMLElement>('.battle-row')[2].click();
    harness.detectChanges();
    httpMock.expectOne({ method: 'GET', url: `${tournamentUrl}/battles/19` }).flush(createRound(3).battles[2]);
    harness.detectChanges();

    expect(page.querySelector('app-battle-modal .battle-result')?.textContent?.trim()).toBe('Tie');
  });

  /**
   * Verifies that a Battle that fails to load shows the error inside the modal rather than in a toast,
   * and that the modal can still be closed.
   */
  it('should show the error inside the modal when the Battle fails to load', async () => {
    const harness = await openTournamentPage({ ...tournament, roundsPlayed: 3 });
    const page = harness.routeNativeElement!;

    page.querySelector<HTMLElement>('.battle-row')!.click();
    harness.detectChanges();
    httpMock
      .expectOne({ method: 'GET', url: `${tournamentUrl}/battles/17` })
      .flush(null, { status: 500, statusText: 'Server Error' });
    harness.detectChanges();

    const modal = page.querySelector('app-battle-modal')!;
    expect(modal.querySelector('.alert-danger')?.textContent).toContain('Server error occurred. Please try again later.');
    expect(page.querySelector('.toast-body')).toBeNull();

    modal.querySelector<HTMLButtonElement>('button.btn-close')!.click();
    harness.detectChanges();

    expect(page.querySelector('app-battle-modal')).toBeNull();
    expect(page.querySelectorAll('app-pokemon-card').length).toBe(16);
  });

  /**
   * Verifies that a 404 on the Battle, as after an API restart, closes the modal and shows that the Tournament
   * no longer exists.
   */
  it('should show that the Tournament no longer exists when the Battle answers 404', async () => {
    const harness = await openTournamentPage({ ...tournament, roundsPlayed: 3 });
    const page = harness.routeNativeElement!;

    page.querySelector<HTMLElement>('.battle-row')!.click();
    harness.detectChanges();
    httpMock
      .expectOne({ method: 'GET', url: `${tournamentUrl}/battles/17` })
      .flush({ error: 'Tournament not found.' }, { status: 404, statusText: 'Not Found' });
    harness.detectChanges();

    expect(page.textContent).toContain('This Tournament no longer exists.');
    expect(page.querySelector('app-battle-modal')).toBeNull();
  });

  /**
   * Verifies that moving to another Tournament while the first one is still loading drops the first request,
   * so the page shows the Tournament of the current URL even though the router reuses the component.
   */
  it('should drop the previous load and show the new Tournament when the id changes while loading', async () => {
    const other: Tournament = {
      ...createStartedTournament(),
      id: '9d8c7b6a-5f4e-4d3c-8b2a-1f0e9d8c7b6a',
      standings: createStartedTournament().standings.map((pokemon) => ({ ...pokemon, name: `Other${pokemon.id}` }))
    };
    const harness = await RouterTestingHarness.create(`/round-by-round/${tournament.id}`);
    const firstRequest = httpMock.expectOne({ method: 'GET', url: tournamentUrl });

    await harness.navigateByUrl(`/round-by-round/${other.id}`);
    httpMock.expectOne({ method: 'GET', url: `${API_BASE_URL}/${other.id}` }).flush(other);
    harness.detectChanges();

    expect(firstRequest.cancelled).toBeTrue();
    expect(TestBed.inject(Router).url).toBe(`/round-by-round/${other.id}`);
    expect(firstCardName(harness)).toBe('Other1');
    expect(harness.routeNativeElement!.querySelectorAll('app-pokemon-card').length).toBe(16);
  });

  /**
   * Opens the Tournament page and answers its loading requests: the Tournament, then its last Round if any.
   */
  async function openTournamentPage(loaded: Tournament): Promise<RouterTestingHarness> {
    const harness = await RouterTestingHarness.create(`/round-by-round/${loaded.id}`);
    httpMock.expectOne({ method: 'GET', url: tournamentUrl }).flush(loaded);
    if (loaded.roundsPlayed > 0) {
      httpMock.expectOne({ method: 'GET', url: `${tournamentUrl}/rounds/${loaded.roundsPlayed}` })
        .flush(createRound(loaded.roundsPlayed));
    }
    harness.detectChanges();
    return harness;
  }

  async function openGoneTournament(): Promise<RouterTestingHarness> {
    const harness = await RouterTestingHarness.create(`/round-by-round/${tournament.id}`);
    httpMock
      .expectOne({ method: 'GET', url: tournamentUrl })
      .flush({ error: 'Tournament not found.' }, { status: 404, statusText: 'Not Found' });
    harness.detectChanges();
    return harness;
  }

  function cardWins(page: HTMLElement, pokemonName: string): string {
    const card = Array.from(page.querySelectorAll('app-pokemon-card'))
      .find((element) => element.querySelector('.fs-5')?.textContent?.trim() === pokemonName);
    return card?.querySelector('.text-success.fw-bold')?.textContent?.trim() ?? '';
  }

  function selectedChip(page: HTMLElement): string {
    return page.querySelector('button.round-chip[aria-pressed="true"]')?.textContent?.trim() ?? '';
  }

  function firstCardName(harness: RouterTestingHarness): string {
    return harness.routeNativeElement!.querySelector('app-pokemon-card .fs-5')?.textContent?.trim() ?? '';
  }
});
