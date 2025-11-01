export type SortBy = 'wins' | 'losses' | 'ties' | 'name' | 'id';
export type SortDirection = 'asc' | 'desc';

export interface SortOptions {
  sortBy: SortBy;
  sortDirection: SortDirection;
}