import { useFetcher } from "react-router";
import { useEffect, useRef, useState } from "react";

export interface TextInputProps {
  subjectId: string;
  date: string;
  subjectName?: string;
  initialContent?: string;
  onSaved?: () => void;
}

export function TextInput({
  subjectId,
  date,
  subjectName,
  initialContent = "",
  onSaved,
}: TextInputProps) {
  const fetcher = useFetcher();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState(initialContent);
  const isSubmitting = fetcher.state !== "idle";
  const isSuccess = fetcher.data?.success;

  useEffect(() => {
    if (isSuccess && onSaved) {
      onSaved();
    }
  }, [isSuccess, onSaved]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="space-y-4">
      {subjectName && (
        <div className="text-sm text-gray-500">
          Narration for <span className="font-medium text-gray-700">{subjectName}</span>
        </div>
      )}
      <fetcher.Form method="post" action="/api/save-narration" className="space-y-4">
        <input type="hidden" name="subjectId" value={subjectId} />
        <input type="hidden" name="date" value={date} />
        <input type="hidden" name="type" value="TEXT" />
        <textarea
          ref={textareaRef}
          name="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Describe what you learned today..."
          rows={6}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral resize-none text-gray-700 placeholder-gray-400"
          disabled={isSubmitting}
        />
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className={`px-6 py-2 rounded-lg font-medium transition-colors min-h-[44px] ${
              isSubmitting || !content.trim()
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-coral text-white hover:bg-coral/90"
            }`}
          >
            {isSubmitting ? "Saving..." : "Save Narration"}
          </button>
        </div>
      </fetcher.Form>
    </div>
  );
}
