export function getClearRank(rankIdx: number): string {
  if (rankIdx === 0) {
    return 'puc';
  } else if (rankIdx === 1) {
    return 'uc';
  } else if (rankIdx === 2) {
    return 'ex';
  } else if (rankIdx === 3) {
    return 'comp';
  } else {
    return 'play';
  }
}
