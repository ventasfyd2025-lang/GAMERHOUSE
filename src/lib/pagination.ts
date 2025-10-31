export type PaginationSegment = number | '...';

export function getPaginationRange(current: number, total: number, delta = 1): PaginationSegment[] {
  if (total <= 0) {
    return [];
  }

  if (total <= 5 + delta) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set<number>();
  pages.add(1);
  pages.add(total);
  pages.add(current);

  for (let step = 1; step <= delta; step += 1) {
    pages.add(current - step);
    pages.add(current + step);
  }

  const sorted = Array.from(pages)
    .filter(page => page >= 1 && page <= total)
    .sort((a, b) => a - b);

  const range: PaginationSegment[] = [];
  let previous: number | null = null;

  sorted.forEach(page => {
    if (previous !== null && page - previous > 1) {
      range.push('...');
    }
    range.push(page);
    previous = page;
  });

  return range;
}
