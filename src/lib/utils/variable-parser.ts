/**
 * Extracts unique variable names from a string template using {{variable}} syntax.
 * Supports spaces inside brackets, special characters, and multiline content.
 * 
 * @param content The string content to parse
 * @returns An array of unique trimmed variable names
 */
export function extractVariables(content: string): string[] {
  if (!content) return [];

  const regex = /\{\{\s*([\s\S]+?)\s*\}\}/g;
  const matches = new Set<string>();
  let match;

  while ((match = regex.exec(content)) !== null) {
    const variableName = match[1].trim();
    if (variableName) {
      matches.add(variableName);
    }
  }

  return Array.from(matches);
}
