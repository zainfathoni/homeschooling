import { useFetcher } from "react-router";

export interface Student {
  id: string;
  name: string;
  avatar?: string | null;
}

interface StudentSwitcherProps {
  students: Student[];
  selectedStudentId?: string;
  onStudentChange?: (studentId: string) => void;
  variant?: "dropdown" | "tabs";
}

export function StudentSwitcher({
  students,
  selectedStudentId,
  onStudentChange,
  variant = "dropdown",
}: StudentSwitcherProps) {
  const fetcher = useFetcher();

  const handleChange = (studentId: string) => {
    fetcher.submit(
      { studentId },
      { method: "post", action: "/api/select-student" }
    );
    onStudentChange?.(studentId);
  };

  if (students.length === 0) {
    return (
      <div className="px-3 py-2 text-sm text-gray-600">No students</div>
    );
  }

  if (students.length === 1) {
    return (
      <div className="px-3 py-2 text-sm text-gray-600">
        {students[0].name}
      </div>
    );
  }

  if (variant === "tabs") {
    return (
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg" role="tablist">
        {students.map((student) => (
          <button
            key={student.id}
            role="tab"
            aria-selected={selectedStudentId === student.id}
            onClick={() => handleChange(student.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
              selectedStudentId === student.id
                ? "bg-white text-coral shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {student.avatar && (
              <img
                src={student.avatar}
                alt=""
                className="w-6 h-6 rounded-full"
              />
            )}
            <span>{student.name}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <select
      value={selectedStudentId ?? students[0]?.id ?? ""}
      onChange={(e) => handleChange(e.target.value)}
      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent min-h-[44px]"
      aria-label="Select student"
    >
      {students.map((student) => (
        <option key={student.id} value={student.id}>
          {student.name}
        </option>
      ))}
    </select>
  );
}
