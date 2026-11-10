/** Assignment names in display order. The main process implements checks for each one. */
export const assignmentNames = ['Simple HTTP'] as const;

export type AssignmentName = (typeof assignmentNames)[number];
