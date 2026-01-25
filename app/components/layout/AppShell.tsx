import { NavLink } from "react-router";

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    path: "week",
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
];

interface AppShellProps {
  children: React.ReactNode;
  selectedStudentId?: string;
}

function SideNav({ selectedStudentId }: { selectedStudentId?: string }) {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-light-gray h-screen sticky top-0">
      <div className="p-4 border-b border-light-gray">
        <h1 className="text-xl font-bold text-dark-gray">Homeschool Planner</h1>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const to = selectedStudentId
              ? `/students/${selectedStudentId}/${item.path}`
              : `/${item.path}`;
            return (
              <li key={item.path}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-lg transition-colors min-h-[44px] ${
                      isActive
                        ? "bg-coral text-white"
                        : "text-medium-gray hover:bg-lavender"
                    }`
                  }
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

function BottomNav({ selectedStudentId }: { selectedStudentId?: string }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-light-gray safe-area-pb">
      <ul className="flex justify-around">
        {navItems.map((item) => {
          const to = selectedStudentId
            ? `/students/${selectedStudentId}/${item.path}`
            : `/${item.path}`;
          return (
            <li key={item.path} className="flex-1">
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-2 min-h-[56px] transition-colors ${
                    isActive ? "text-coral" : "text-medium-gray"
                  }`
                }
              >
                {item.icon}
                <span className="text-xs mt-1">{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function MobileHeader() {
  return (
    <header className="md:hidden sticky top-0 bg-white border-b border-light-gray z-10">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-lg font-bold text-dark-gray">Homeschool Planner</h1>
      </div>
    </header>
  );
}

export function AppShell({ children, selectedStudentId }: AppShellProps) {
  return (
    <div className="min-h-screen bg-lavender">
      <div className="flex">
        <SideNav selectedStudentId={selectedStudentId} />

        <div className="flex-1 flex flex-col min-h-screen">
          <MobileHeader />

          <main className="flex-1 pb-20 md:pb-0">{children}</main>

          <BottomNav selectedStudentId={selectedStudentId} />
        </div>
      </div>
    </div>
  );
}
