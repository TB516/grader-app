/** Channel names shared by the main process and preload so the two cannot drift apart. */
export const channels = {
  openResults: 'open-results',
  grade: 'grade'
} as const;
