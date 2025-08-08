// import { SortValue } from '@credebl/enum/enum';

export class IGetAllCredDefsDto {
  pageSize?: number;
  pageNumber?: number;
  searchByText?: string;
  sorting?: string;
  revocable?: boolean;
  sortByValue?: string;
}
