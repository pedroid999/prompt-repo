import { diffLines, Change } from 'diff';

export interface DiffLine {
  content: string;
  type: 'added' | 'removed' | 'unchanged';
  oldLineNumber?: number;
  newLineNumber?: number;
}

/**
 * Calculates a line-by-line unified diff between two strings.
 * Handles Windows (\r\n) and Unix (\n) line endings robustly.
 */
export function calculateDiff(oldStr: string, newStr: string): DiffLine[] {
  // Normalize line endings to \n for consistent diffing
  const normalizedOld = (oldStr || '').replace(/\r\n/g, '\n');
  const normalizedNew = (newStr || '').replace(/\r\n/g, '\n');

  const changes: Change[] = diffLines(normalizedOld, normalizedNew);
  const diffLinesResult: DiffLine[] = [];

  let oldLineCount = 1;
  let newLineCount = 1;

  changes.forEach((change) => {
    // Split by newline
    const lines = change.value.split('\n');
    
    // Remove the trailing empty string if the change ended with a newline
    // unless it's the only line (empty line change)
    const effectiveLines = (lines.length > 1 && lines[lines.length - 1] === '') 
      ? lines.slice(0, -1) 
      : lines;

    effectiveLines.forEach((line) => {
      if (change.added) {
        diffLinesResult.push({
          content: line,
          type: 'added',
          newLineNumber: newLineCount++,
        });
      } else if (change.removed) {
        diffLinesResult.push({
          content: line,
          type: 'removed',
          oldLineNumber: oldLineCount++,
        });
      } else {
        diffLinesResult.push({
          content: line,
          type: 'unchanged',
          oldLineNumber: oldLineCount++,
          newLineNumber: newLineCount++,
        });
      }
    });
  });

  return diffLinesResult;
}
