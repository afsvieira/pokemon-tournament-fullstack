export enum SortBy {
  wins = 'wins',
  losses = 'losses',
  ties = 'ties',
  name = 'name',
  id = 'id'
}

export enum SortDirection {
  asc = 'asc',
  desc = 'desc'
}

export interface SortOptions {
  sortBy: SortBy;
  sortDirection: SortDirection;
}
