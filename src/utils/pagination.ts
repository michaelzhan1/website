export const ITEMS_PER_PAGE = 5;

export function paginateItems<T>(
  items: T[],
  currentPage: number,
  itemsPerPage = ITEMS_PER_PAGE,
) {
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;

  return {
    items: items.slice(start, start + itemsPerPage),
    totalPages,
  };
}
