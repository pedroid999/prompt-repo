// Use [^}]+? to avoid greedy matching while capturing multiline content
export const VARIABLE_REGEX = /\{\{\s*([^}]+?)\s*\}\}/g;

/**
 * Extracts unique variable names from a string template using {{variable}} syntax.
 * Supports spaces inside brackets, special characters, and multiline content.
 * 
 * Note: Does not support nested braces. For "{{ {{var}} }}", it will capture "{{var}}".
 * 
 * @param content The string content to parse
 * @returns An array of unique trimmed variable names
 */
export function extractVariables(content: string): string[] {
  if (!content) return [];

  const matches = new Set<string>();
  let match;

  // Reset lastIndex because we're using a global regex
  VARIABLE_REGEX.lastIndex = 0;

  while ((match = VARIABLE_REGEX.exec(content)) !== null) {
    const variableName = match[1].trim();
    if (variableName) {
      matches.add(variableName);
    }
  }

    return [...matches];

  }

  

  /**

   * Resolves a prompt template by replacing {{variable}} placeholders with provided values.

   * 

   * @param content The template string

   * @param values Map of variable names to their values

   * @returns The resolved string

   */

  export function resolvePrompt(content: string, values: Record<string, string>): string {

    if (!content) return "";

    

    VARIABLE_REGEX.lastIndex = 0;

    return content.replace(VARIABLE_REGEX, (match, variableName) => {

      const trimmedName = variableName.trim();

      const value = values[trimmedName];

      

      // If value is defined (including empty string or 0), use it.

      // Otherwise return the original placeholder.

      return value !== undefined ? value : match;

    });

  }

  