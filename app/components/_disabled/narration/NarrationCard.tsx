import { Link } from "react-router";
import { format } from "date-fns";

export interface NarrationCardData {
  id: string;
  type: "TEXT" | "VOICE" | "PHOTO";
  content: string;
  date: string;
  createdAt: string;
}

interface NarrationCardProps {
  narration: NarrationCardData;
}

const typeIcons: Record<NarrationCardData["type"], string> = {
  TEXT: "✏️",
  VOICE: "🎤",
  PHOTO: "📷",
};

const typeLabels: Record<NarrationCardData["type"], string> = {
  TEXT: "Text",
  VOICE: "Voice",
  PHOTO: "Photo",
};

export function NarrationCard({ narration }: NarrationCardProps) {
  const dateFormatted = format(new Date(narration.date), "MMM d, yyyy");

  return (
    <Link
      to={`/narration/${narration.id}`}
      className="block bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-3">
        <span className="text-xl" aria-label={typeLabels[narration.type]}>
          {typeIcons[narration.type]}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-lavender text-gray-600">
              {typeLabels[narration.type]}
            </span>
            <span className="text-xs text-gray-400">{dateFormatted}</span>
          </div>
          <p className="text-sm text-gray-700 line-clamp-2">
            {narration.type === "TEXT"
              ? narration.content
              : narration.type === "VOICE"
                ? "Voice recording"
                : "Photo"}
          </p>
        </div>
        <svg
          className="w-5 h-5 text-gray-400 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </Link>
  );
}
