import { IPaginationSortingDto } from './interface';

export interface IIntentTemplateSearchCriteria extends IPaginationSortingDto {
  id?: string;
  intent?: string;
  intentId?: string;
  templateId?: string;
  assignedToOrgId?: string;
  templateCreatedByOrgId?: string;
}

export interface IIntentTemplateItem {
  id: string;
  createDateTime: Date;
  createdBy: string;
  intentId: string;
  templateId: string;
  intent?: string | null;
  templateName?: string | null;
  assignedToOrg?: string | null;
  templateCreatedByOrg?: string | null;
}

export interface IIntentTemplateList {
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number;
  previousPage: number;
  lastPage: number;
  data: IIntentTemplateItem[];
}

export interface IIntentTemplateListCount {
  count: number;
  list: IIntentTemplateItem[];
}
