import { cn } from "@/lib/utils";
import { resolvePrompt } from "@/lib/utils/variable-parser";

interface ResolvedPreviewProps {
  content: string;
  values: Record<string, string>;
  className?: string;
}

export function ResolvedPreview({ content, values, className }: ResolvedPreviewProps) {
  const resolvedContent = resolvePrompt(content, values);

  return (
    <div
      className={cn(
        "font-mono whitespace-pre-wrap rounded-md bg-muted p-3 md:p-4 text-xs md:text-sm text-foreground",
        className
      )}
    >
      {resolvedContent}
    </div>
  );
}
