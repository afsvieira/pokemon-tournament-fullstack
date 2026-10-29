import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { API_BASE_URL } from '../../services/api-base-url';
import {
  createProcessedRound,
  createRound,
  createStartedTournament,
  createTournamentWithRecords
} from '../../testing/test-tournament';
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
   * Verifies that a just-started Tournament shows its 16 Pokémon in the Standings, Round 0 of 15,
   * an empty Round panel, and no "View Battles" buttons.
   */
  it('should show the 16 Pokémon without View Battles when the Tournament has no Rounds yet', async () => {
    const harness = await RouterTestingHarness.create(`/round-by-round/${tournament.id}`);

    httpMock.expectOne({ method: 'GET', url: tournamentUrl }).flush(tournament);
    harness.detectChanges();

    const page = harness.routeNativeElement!;
    expect(standingsRows(page).length).toBe(16);
    expect(page.textContent).toContain('Round 0 of 15');
    expect(page.textContent).toContain('No Rounds yet');
    expect(page.textContent).not.toContain('View Battles');
    expect(page.querySelector('a[href="/round-by-round"]')?.textContent).toContain('Tournament History');
  });

  /**
   * Verifies that the Standings list one row per Pokémon in Position order (most wins, then fewest losses, then name),
   * that equal records share a Position and the next one skips (1, 1, 3), that the row shows the sprite, type,
   * W, L, T and id, and that neither the win rate nor the Instant Simulation's sort controls are on the page.
   */
  it('should list the Standings in Position order, sharing a Position for equal records', async () => {
    const harness = await openTournamentPage(createTournamentWithRecords([
      { wins: 5, losses: 1, ties: 0 },
      { wins: 0, losses: 0, ties: 0 },
      { wins: 5, losses: 0, ties: 0 },
      { wins: 0, losses: 0, ties: 0 },
      { wins: 0, losses: 0, ties: 0 },
      { wins: 0, losses: 0, ties: 0 },
      { wins: 5, losses: 0, ties: 0 },
      { wins: 0, losses: 0, ties: 0 },
      { wins: 0, losses: 0, ties: 0 },
      { wins: 0, losses: 0, ties: 0 },
      { wins: 0, losses: 0, ties: 0 },
      { wins: 4, losses: 0, ties: 1 }
    ]));
    const page = harness.routeNativeElement!;

    expect(standingsNames(page).slice(0, 5)).toEqual(['Pokemon3', 'Pokemon7', 'Pokemon1', 'Pokemon12', 'Pokemon10']);
    expect(standingsPositions(page).slice(0, 5)).toEqual(['1', '1', '3', '4', '5']);
    expect(standingsPositions(page)[15]).toBe('5');
    const leader = standingsRows(page)[0];
    expect(leader.querySelector('img')?.getAttribute('src')).toBe('https://img.example/3.png');
    expect(leader.querySelector('.visually-hidden')?.textContent?.trim()).toBe('Normal');
    expect(leader.querySelector('.wins')?.textContent?.trim()).toBe('5');
    expect(leader.querySelector('.losses')?.textContent?.trim()).toBe('0');
    expect(leader.querySelector('.ties')?.textContent?.trim()).toBe('0');
    expect(leader.querySelector('.pokemon-id')?.textContent?.trim()).toBe('#003');
    expect(page.textContent).toContain('Standings');
    expect(page.textContent).not.toContain('Win Rate');
    expect(page.querySelector('app-sort-controls')).toBeNull();
    expect(page.querySelector('app-pokemon-card')).toBeNull();
  });

  /**
   * Verifies that clicking a header sorts the Standings by that column (W, L and T descending first, Name and ID
   * ascending first), that a second click flips the direction, that aria-sort follows the sorted header,
   * that every Pokémon keeps its Position whatever the order, and that sorting sends no request.
   */
  it('should sort the Standings by the clicked header, flipping on a second click, keeping Positions', async () => {
    const harness = await openTournamentPage(createTournamentWithRecords([
      { wins: 3, losses: 2, ties: 0 },
      { wins: 4, losses: 1, ties: 0 },
      { wins: 2, losses: 1, ties: 2 }
    ]));
    const page = harness.routeNativeElement!;
    expect(standingsNames(page).slice(0, 3)).toEqual(['Pokemon2', 'Pokemon1', 'Pokemon3']);
    expect(ariaSort(page)).toEqual({ Wins: 'descending' });

    header(page, 'Losses').click();
    harness.detectChanges();
    expect(standingsNames(page).slice(0, 2)).toEqual(['Pokemon1', 'Pokemon2']);
    expect(standingsPositions(page).slice(0, 2)).toEqual(['2', '1']);
    expect(ariaSort(page)).toEqual({ Losses: 'descending' });

    header(page, 'Losses').click();
    harness.detectChanges();
    expect(standingsNames(page)[15]).toBe('Pokemon1');
    expect(standingsPositions(page)[15]).toBe('2');
    expect(ariaSort(page)).toEqual({ Losses: 'ascending' });

    header(page, 'Ties').click();
    harness.detectChanges();
    expect(standingsNames(page)[0]).toBe('Pokemon3');
    expect(ariaSort(page)).toEqual({ Ties: 'descending' });

    header(page, 'Ties').click();
    harness.detectChanges();
    expect(standingsNames(page)[15]).toBe('Pokemon3');
    expect(ariaSort(page)).toEqual({ Ties: 'ascending' });

    header(page, 'Pokémon').click();
    harness.detectChanges();
    expect(standingsNames(page).slice(0, 3)).toEqual(['Pokemon1', 'Pokemon10', 'Pokemon11']);
    expect(ariaSort(page)).toEqual({ Pokémon: 'ascending' });

    header(page, 'Pokémon').click();
    harness.detectChanges();
    expect(standingsNames(page).slice(0, 2)).toEqual(['Pokemon9', 'Pokemon8']);
    expect(ariaSort(page)).toEqual({ Pokémon: 'descending' });

    header(page, 'ID').click();
    harness.detectChanges();
    expect(standingsNames(page).slice(0, 3)).toEqual(['Pokemon1', 'Pokemon2', 'Pokemon3']);
    expect(ariaSort(page)).toEqual({ ID: 'ascending' });

    header(page, 'ID').click();
    harness.detectChanges();
    expect(standingsNames(page)[0]).toBe('Pokemon16');
    expect(ariaSort(page)).toEqual({ ID: 'descending' });

    header(page, 'Wins').click();
    harness.detectChanges();
    expect(standingsNames(page)[0]).toBe('Pokemon2');
    expect(ariaSort(page)).toEqual({ Wins: 'descending' });

    header(page, 'Wins').click();
    harness.detectChanges();
    expect(standingsNames(page)[15]).toBe('Pokemon2');
    expect(ariaSort(page)).toEqual({ Wins: 'ascending' });
  });

  /**
   * Verifies that a Complete Tournament with a single leader highlights that one row with a trophy.
   */
  it('should highlight the single leader once the Tournament is Complete', async () => {
    const harness = await openTournamentPage(createTournamentWithRecords([
      { wins: 13, losses: 1, ties: 1 },
      { wins: 14, losses: 0, ties: 1 },
      { wins: 12, losses: 2, ties: 1 }
    ], 15));
    const page = harness.routeNativeElement!;

    expect(leaderNames(page)).toEqual(['Pokemon2']);
    expect(page.querySelectorAll('app-standings .fa-trophy').length).toBe(1);
    expect(standingsPositions(page).slice(0, 3)).toEqual(['1', '2', '3']);
  });

  /**
   * Verifies that a Tournament still in play highlights no row, and that once Round 15 makes it Complete
   * every row on Position 1 is highlighted with a trophy, and only those.
   */
  it('should highlight every row on Position 1 once the Tournament is Complete', async () => {
    const sharedLead = [
      { wins: 14, losses: 0, ties: 1 },
      { wins: 13, losses: 1, ties: 1 },
      { wins: 14, losses: 0, ties: 1 }
    ];
    const harness = await openTournamentPage(createTournamentWithRecords(sharedLead, 14));
    const page = harness.routeNativeElement!;
    expect(leaderNames(page)).toEqual([]);
    expect(page.querySelector('app-standings .fa-trophy')).toBeNull();

    page.querySelector<HTMLButtonElement>('button.process-round')!.click();
    httpMock.expectOne({ method: 'POST', url: `${tournamentUrl}/rounds` }).flush({
      ...createProcessedRound(15),
      standings: createTournamentWithRecords(sharedLead, 15).standings
    });
    harness.detectChanges();

    expect(leaderNames(page)).toEqual(['Pokemon1', 'Pokemon3']);
    expect(page.querySelectorAll('app-standings .fa-trophy').length).toBe(2);
    expect(standingsPositions(page).slice(0, 3)).toEqual(['1', '1', '3']);
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
    expect(standingsRows(page).length).toBe(0);

    page.querySelector<HTMLButtonElement>('.load-error button')!.click();
    httpMock.expectOne({ method: 'GET', url: tournamentUrl }).flush(tournament);
    harness.detectChanges();

    expect(page.querySelector('.load-error')).toBeNull();
    expect(standingsRows(page).length).toBe(16);
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
    expect(standingsRows(page).length).toBe(0);
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
    expect(standingsRows(page).length).toBe(16);
  });

  /**
   * Verifies that Process Round shows the new Round's 8 Battles with their results,
   * moves the header to "Round 1 of 15" and updates the Standings from the returned ones.
   */
  it('should show the Round and update the Standings when Process Round succeeds', async () => {
    const harness = await RouterTestingHarness.create(`/round-by-round/${tournament.id}`);
    httpMock.expectOne({ method: 'GET', url: tournamentUrl }).flush(tournament);
    harness.detectChanges();
    const page = harness.routeNativeElement!;
    expect(standingsWins(page, 'Pokemon1')).toBe('0');

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
    expect(page.textContent).toContain('Round 1 of 15');
    expect(page.textContent).not.toContain('No Rounds yet');
    expect(standingsWins(page, 'Pokemon1')).toBe('1');
  });

  /**
   * Verifies that a Battle row marks the winner in place: the winner's name carries a trophy and the loser's doesn't,
   * a tie shows "Tie" between two unmarked names, the row's accessible name reads the whole result,
   * and the old trailing "X wins" text is gone.
   */
  it('should mark the winner in place in each Battle row, and Tie between two unmarked names', async () => {
    const harness = await openTournamentPage({ ...tournament, roundsPlayed: 1 });
    const battleRows = harness.routeNativeElement!.querySelectorAll('.battle-row');

    const [winner, loser] = Array.from(battleRows[0].querySelectorAll('.fighter'));
    expect(winner.textContent).toContain('Pokemon1');
    expect(winner.querySelector('.fa-trophy')).not.toBeNull();
    expect(loser.textContent).toContain('Pokemon2');
    expect(loser.querySelector('.fa-trophy')).toBeNull();
    expect(battleRows[0].getAttribute('aria-label')).toBe('Battle 1, Pokemon1 vs Pokemon2, Pokemon1 wins');
    expect(battleRows[0].textContent).not.toContain('wins');

    const tie = battleRows[2];
    expect(tie.querySelector('.battle-marker')?.textContent?.trim()).toBe('Tie');
    expect(tie.querySelectorAll('.fighter').length).toBe(2);
    expect(tie.querySelector('.fa-trophy')).toBeNull();
    expect(tie.getAttribute('aria-label')).toBe('Battle 3, Pokemon5 vs Pokemon6, Tie');
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
   * that a chip shows its Round while the header and Standings stay current, and that each Round is fetched only once.
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
    expect(standingsRows(page).length).toBe(16);

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
   * with image, type and base experience, the winner marked as in the row; and that the modal closes.
   */
  it('should open a Battle in a modal with both Pokémon and the winner marked', async () => {
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
    const [winner, loser] = Array.from(modal.querySelectorAll('.fighter'));
    expect(winner.textContent).toContain('Pokemon1');
    expect(winner.querySelector('.fa-trophy')).not.toBeNull();
    expect(loser.textContent).toContain('Pokemon2');
    expect(loser.querySelector('.fa-trophy')).toBeNull();
    expect(modal.querySelector('.battle-result')?.textContent).toContain('Pokemon1 wins');

    modal.querySelector<HTMLButtonElement>('button.btn-close')!.click();
    harness.detectChanges();

    expect(page.querySelector('app-battle-modal')).toBeNull();
  });

  /**
   * Verifies that the modal of a tied Battle shows "Tie" instead of a winner, and marks neither Pokémon.
   */
  it('should show Tie and mark neither Pokémon in the Battle modal when the Battle is a tie', async () => {
    const harness = await openTournamentPage({ ...tournament, roundsPlayed: 3 });
    const page = harness.routeNativeElement!;

    page.querySelectorAll<HTMLElement>('.battle-row')[2].click();
    harness.detectChanges();
    httpMock.expectOne({ method: 'GET', url: `${tournamentUrl}/battles/19` }).flush(createRound(3).battles[2]);
    harness.detectChanges();

    const modal = page.querySelector('app-battle-modal')!;
    expect(modal.querySelector('.battle-result')?.textContent?.trim()).toBe('Tie');
    expect(modal.querySelectorAll('.fighter').length).toBe(2);
    expect(modal.querySelector('.fa-trophy')).toBeNull();
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
    expect(standingsRows(page).length).toBe(16);
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
    expect(standingsNames(harness.routeNativeElement!)[0]).toBe('Other1');
    expect(standingsRows(harness.routeNativeElement!).length).toBe(16);
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

  function standingsRows(page: HTMLElement): HTMLElement[] {
    return Array.from(page.querySelectorAll<HTMLElement>('app-standings tbody tr'));
  }

  function standingsNames(page: HTMLElement): string[] {
    return standingsRows(page).map((row) => row.querySelector('.pokemon-name')?.textContent?.trim() ?? '');
  }

  function standingsPositions(page: HTMLElement): string[] {
    return standingsRows(page).map((row) => row.querySelector('.position')?.textContent?.trim() ?? '');
  }

  /** A sortable header's button, found by the name assistive technology reads: Pokémon, Wins, Losses, Ties or ID */
  function header(page: HTMLElement, name: string): HTMLButtonElement {
    return Array.from(page.querySelectorAll<HTMLButtonElement>('app-standings th button'))
      .find((button) => headerName(button) === name)!;
  }

  /** The sorted headers by name with their aria-sort; exactly one is expected */
  function ariaSort(page: HTMLElement): Record<string, string> {
    return Object.fromEntries(Array.from(page.querySelectorAll('app-standings th[aria-sort]'))
      .map((th) => [headerName(th.querySelector('button')!), th.getAttribute('aria-sort') ?? '']));
  }

  function headerName(button: HTMLElement): string {
    const hiddenName = button.querySelector('.visually-hidden')?.textContent?.trim();
    return hiddenName ?? button.textContent?.trim() ?? '';
  }

  function leaderNames(page: HTMLElement): string[] {
    return standingsRows(page)
      .filter((row) => row.classList.contains('leader'))
      .map((row) => row.querySelector('.pokemon-name')?.textContent?.trim() ?? '');
  }

  function standingsWins(page: HTMLElement, pokemonName: string): string {
    const row = standingsRows(page).find((element) => element.querySelector('.pokemon-name')?.textContent?.trim() === pokemonName);
    return row?.querySelector('.wins')?.textContent?.trim() ?? '';
  }

  function selectedChip(page: HTMLElement): string {
    return page.querySelector('button.round-chip[aria-pressed="true"]')?.textContent?.trim() ?? '';
  }
});
