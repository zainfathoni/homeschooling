import { Link } from "react-router";
import { NarrationCard, type NarrationCardData } from "./NarrationCard";

export interface SubjectWithNarrations {
  id: string;
  name: string;
  icon: string | null;
  narrations: NarrationCardData[];
}

interface NarrationListProps {
  subjects: SubjectWithNarrations[];
  showViewAll?: boolean;
  studentId?: string;
}

export function NarrationList({
  subjects,
  showViewAll = true,
  studentId,
}: NarrationListProps) {
  if (subjects.length === 0) {
    return (
      <div className="text-center py-12" data-testid="narration-list-empty">
        <p className="text-medium-gray">No narrations yet</p>
      </div>
    );
  }

  const hasNarrations = subjects.some((s) => s.narrations.length > 0);
  if (!hasNarrations) {
    return (
      <div className="text-center py-12" data-testid="narration-list-empty">
        <p className="text-medium-gray">No narrations yet</p>
        <p className="text-sm text-medium-gray mt-2">
          Add narrations from the daily schedule view
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="narration-list-loaded">
      {subjects
        .filter((subject) => subject.narrations.length > 0)
        .map((subject) => (
          <section key={subject.id}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-dark-gray flex items-center gap-2">
                {subject.icon && <span>{subject.icon}</span>}
                {subject.name}
                <span className="text-sm font-normal text-medium-gray">
                  ({subject.narrations.length})
                </span>
              </h2>
              {showViewAll && subject.narrations.length > 3 && (
                <Link
                  to={studentId ? `/students/${studentId}/narrations/${subject.id}` : `/narrations/${subject.id}`}
                  className="text-sm text-coral hover:text-coral-hover font-medium min-h-[44px] flex items-center"
                >
                  View all →
                </Link>
              )}
            </div>
            <div className="space-y-3">
              {(showViewAll
                ? subject.narrations.slice(0, 3)
                : subject.narrations
              ).map((narration) => (
                <NarrationCard key={narration.id} narration={narration} />
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}
