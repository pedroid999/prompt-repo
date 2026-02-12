/**
 * Hydrates the resolution form values with data from a snapshot.
 * 
 * @param extractedVariables The list of variables currently present in the prompt.
 * @param snapshotVariables The variables stored in the snapshot.
 * @returns A record of variables with snapshot values where available, or empty strings otherwise.
 */
export function hydrateResolutionForm(
  extractedVariables: string[],
  snapshotVariables?: Record<string, string>
): Record<string, string> {
  const result: Record<string, string> = {};

  extractedVariables.forEach((variable) => {
    result[variable] = snapshotVariables?.[variable] ?? '';
  });

  return result;
}
