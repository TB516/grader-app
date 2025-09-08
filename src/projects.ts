export const projects = [
  'Simple HTTP',
  'Streaming Media',
  'HTTP API I',
  'HTTP API II',
  'Domomaker C',
  'Domomaker E'
] as const;

export type ProjectTypes = (typeof projects)[number];
