import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TournamentService } from './tournament.service';
import { TournamentPokemon } from '../models/tournament-pokemon.model';
import { SortBy, SortDirection } from '../models/sort-options.model';

/**
 * Unit tests for TournamentService.
 * Tests HTTP communication and service initialization.
 */
describe('TournamentService', () => {
  let service: TournamentService;
  let httpMock: HttpTestingController;

  const mockApiResponse: TournamentPokemon[] = [
    {
      id: 1,
      name: 'Bulbasaur',
      type: 'grass',
      baseExperience: 64,
      imageUrl: 'https://example.com/1.png',
      wins: 5,
      losses: 3,
      ties: 2,
      winRate: 50.0,
      battleRecords: []
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TournamentService]
    });

    service = TestBed.inject(TournamentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  /**
   * Verifies service is created successfully.
   */
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  /**
   * Tests successful API call and data retrieval.
   */
  it('should fetch tournament statistics successfully', () => {
    service.getTournamentStatistics(SortBy.wins, SortDirection.desc).subscribe(data => {
      expect(data).toEqual(mockApiResponse);
      expect(data.length).toBe(1);
      expect(data[0].name).toBe('Bulbasaur');
    });

    const req = httpMock.expectOne(req => req.url.includes('tournament'));
    expect(req.request.method).toBe('GET');
    req.flush(mockApiResponse);
  });
});
