/* eslint-disable camelcase */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/explicit-function-return-type
export function paginator<T>(
  items: T[],
  current_page: number,
  items_per_page: number
) {
  const page = current_page || 1,
    per_page = items_per_page || 10,
    offset = (page - 1) * per_page,
    paginatedItems = items.slice(offset).slice(0, items_per_page),
    total_pages = Math.ceil(items.length / per_page);

  return {
    page,
    pageSize: per_page,
    previousPage: page - 1 ? page - 1 : null,
    nextPage: total_pages > page ? page + 1 : null,
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
