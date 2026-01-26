import { useNavigate, useLocation } from "react-router";

export interface Student {
  id: string;
  name: string;
  avatar?: string | null;
}

interface StudentSwitcherProps {
  students: Student[];
  selectedStudentId?: string;
  variant?: "dropdown" | "tabs";
}

export function StudentSwitcher({
  students,
  selectedStudentId,
  variant = "dropdown",
}: StudentSwitcherProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (newStudentId: string) => {
    if (
      selectedStudentId &&
      location.pathname.includes(`/students/${selectedStudentId}`)
    ) {
      const newPath = location.pathname.replace(
        `/students/${selectedStudentId}`,
        `/students/${newStudentId}`
      );
      navigate(newPath + location.search);
    } else {
      navigate(`/students/${newStudentId}/week`);
    }
  };

  if (students.length === 0) {
    return <div className="px-3 py-2 text-sm text-medium-gray">No students</div>;
  }

  if (students.length === 1) {
    return (
      <div className="px-3 py-2 text-sm text-dark-gray font-medium">
        {students[0].name}
      </div>
    );
  }

  if (variant === "tabs") {
    return (
      <div className="flex gap-1 bg-lavender p-1 rounded-lg" role="tablist">
        {students.map((student) => (
          <button
            key={student.id}
            role="tab"
            aria-selected={selectedStudentId === student.id}
            onClick={() => handleChange(student.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
              selectedStudentId === student.id
                ? "bg-white text-coral shadow-sm"
                : "text-medium-gray hover:bg-white/50"
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
      className="w-full px-3 py-2 bg-white border border-light-gray rounded-lg text-sm text-dark-gray focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent min-h-[44px]"
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
