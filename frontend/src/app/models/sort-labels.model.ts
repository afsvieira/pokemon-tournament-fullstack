import { SortBy } from './sort-options.model';

export const SortByLabels: Record<SortBy, string> = {
  [SortBy.wins]: 'Wins',
  [SortBy.losses]: 'Losses',
  [SortBy.ties]: 'Ties',
  [SortBy.name]: 'Name',
  [SortBy.id]: 'ID'
};
