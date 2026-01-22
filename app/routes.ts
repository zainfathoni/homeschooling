import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),

  // Legacy routes that redirect to nested student routes
  route("week", "routes/week.tsx"),
  route("week/:weekStart", "routes/week.$weekStart.tsx"),
  route("week/:weekStart/settings", "routes/week.$weekStart.settings.tsx"),
  route("narrations", "routes/narrations.tsx"),
  route("narrations/:subjectId", "routes/narrations.$subjectId.tsx"),

  // Nested student routes
  route("students/:studentId", "routes/students.$studentId.tsx", [
    // Week routes
    route("week", "routes/students.$studentId.week._index.tsx"),
    route("week/:weekStart", "routes/students.$studentId.week.$weekStart.tsx"),
    route(
      "week/:weekStart/settings",
      "routes/students.$studentId.week.$weekStart.settings.tsx"
    ),
    // Settings redirect (redirects to current week's settings)
    route("settings", "routes/students.$studentId.settings.tsx"),
    // Narration routes
    route("narrations", "routes/students.$studentId.narrations._index.tsx"),
    route(
      "narrations/:subjectId",
      "routes/students.$studentId.narrations.$subjectId.tsx"
    ),
  ]),

  // Auth routes
  route("login", "routes/login.tsx"),
  route("magic", "routes/magic.tsx"),
  route("logout", "routes/logout.tsx"),

  // API routes
  route("api/toggle-completion", "routes/api.toggle-completion.tsx"),
  route("api/select-option", "routes/api.select-option.tsx"),
  route("api/select-student", "routes/api.select-student.tsx"),
  route("api/save-narration", "routes/api.save-narration.tsx"),

  // Individual narration routes (not nested under students)
  route("narration/new", "routes/narration.new.tsx"),
  route("narration/:id", "routes/narration.$id.tsx"),
] satisfies RouteConfig;
