/** Assignment names in display order. The main process implements checks for each one. */
export const assignmentNames = ['Simple HTTP', 'HTTP API I'] as const;

export type AssignmentName = (typeof assignmentNames)[number];
