import { NavLink, useLocation } from "react-router";
import { useState } from "react";
import {
  StudentSwitcher,
  type Student,
} from "~/components/common/StudentSwitcher";
import { buildStudentUrl } from "~/utils/student-url";

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    to: "/week",
    label: "Schedule",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    to: "/narrations",
    label: "Narrations",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    ),
  },
  {
    to: "/settings",
    label: "Settings",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
];

interface AppShellProps {
  children: React.ReactNode;
  userRole?: "PARENT" | "STUDENT";
  students?: Student[];
  selectedStudentId?: string;
}

function SideNav({
  userRole,
  students,
  selectedStudentId,
}: {
  userRole?: "PARENT" | "STUDENT";
  students?: Student[];
  selectedStudentId?: string;
}) {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">Homeschool Planner</h1>
      </div>

      {userRole === "PARENT" && students && students.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <label className="block text-xs font-medium text-gray-500 mb-2">
            Viewing as
          </label>
          <StudentSwitcher
            students={students}
            selectedStudentId={selectedStudentId}
          />
        </div>
      )}

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={buildStudentUrl(item.to, selectedStudentId)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-lg transition-colors min-h-[44px] ${
                    isActive
                      ? "bg-coral text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`
                }
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

function BottomNav({ selectedStudentId }: { selectedStudentId?: string }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb">
      <ul className="flex justify-around">
        {navItems.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={buildStudentUrl(item.to, selectedStudentId)}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-2 min-h-[56px] transition-colors ${
                  isActive ? "text-coral" : "text-gray-500"
                }`
              }
            >
              {item.icon}
              <span className="text-xs mt-1">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function MobileHeader({
  userRole,
  students,
  selectedStudentId,
}: {
  userRole?: "PARENT" | "STUDENT";
  students?: Student[];
  selectedStudentId?: string;
}) {
  const [showSwitcher, setShowSwitcher] = useState(false);

  const showStudentSwitcher =
    userRole === "PARENT" && students && students.length > 1;

  return (
    <header className="md:hidden sticky top-0 bg-white border-b border-gray-200 z-10">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-lg font-bold text-gray-800">Homeschool Planner</h1>
        {showStudentSwitcher && (
          <button
            onClick={() => setShowSwitcher(!showSwitcher)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm min-h-[44px]"
          >
            <span>
              {students.find((s) => s.id === selectedStudentId)?.name ??
                students[0]?.name}
            </span>
            <svg
              className={`w-4 h-4 transition-transform ${showSwitcher ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        )}
      </div>
      {showSwitcher && showStudentSwitcher && (
        <div className="px-4 pb-4">
          <StudentSwitcher
            students={students}
            selectedStudentId={selectedStudentId}
          />
        </div>
      )}
    </header>
  );
}

export function AppShell({
  children,
  userRole,
  students,
  selectedStudentId,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-lavender">
      <div className="flex">
        <SideNav
          userRole={userRole}
          students={students}
          selectedStudentId={selectedStudentId}
        />

        <div className="flex-1 flex flex-col min-h-screen">
          <MobileHeader
            userRole={userRole}
            students={students}
            selectedStudentId={selectedStudentId}
          />

          <main className="flex-1 pb-20 md:pb-0">{children}</main>

          <BottomNav selectedStudentId={selectedStudentId} />
        </div>
      </div>
    </div>
  );
}
