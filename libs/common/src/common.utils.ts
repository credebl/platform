import { NotFoundException } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { ResponseMessages } from './response-messages';
dotenv.config();
/* eslint-disable camelcase */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/explicit-function-return-type
export function paginator<T>(
  items: T[],
  current_page: number,
  items_per_page: number
) {
  const page: number = Number(current_page) || 1;
  const per_page: number = Number(items_per_page) || 10;
  const offset: number = (page - 1) * per_page;
  const paginatedItems = items.slice(offset, offset + per_page);
  const total_pages: number = Math.ceil(items.length / per_page);

  const previousPage: number | null = 1 < page ? page - 1 : null;
  const nextPage: number | null = page < total_pages ? page + 1 : null;
  return {
    page,
    pageSize: per_page,
    previousPage,
    nextPage,
    totalItems: items.length,
    lastPage: total_pages,
    data: paginatedItems
  };
}

export function orderValues(key, order = 'asc') {
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types
  return function innerSort(a, b) {
    if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
      // property doesn't exist on either object
      return 0;
    }

    const varA = 'string' === typeof a[key] ? a[key].toUpperCase() : a[key];
    const varB = 'string' === typeof b[key] ? b[key].toUpperCase() : b[key];

    let comparison = 0;
    if (varA > varB) {
      comparison = 1;
    } else if (varA < varB) {
      comparison = -1;
    }
    return 'desc' === order ? comparison * -1 : comparison;
  };
}


export function convertUrlToDeepLinkUrl(url: string): string {
  const deepLinkDomain = process.env.DEEPLINK_DOMAIN;
  if (!deepLinkDomain) {
    throw new NotFoundException(ResponseMessages.shorteningUrl.error.deepLinkDomainNotFound);
  }
  const deepLinkUrl = deepLinkDomain.concat(url);
  return deepLinkUrl;
}

export const networkNamespace = (did: string):string => {
  // Split the DID into segments using the colon as a delimiter
  const segments = did.split(':');
  const containsTestnet = segments.some(segment => segment.includes('testnet')) || segments.some(segment => segment.includes('sepolia'));
  if (containsTestnet) {
    return `${segments[1]}:${segments[2]}`;
  } else {
    return segments[1];
  }
};