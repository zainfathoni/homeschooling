import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),

  // Nested student routes
  route("students/:studentId", "routes/students.$studentId.tsx", [
    // Week routes
    route("week", "routes/students.$studentId.week._index.tsx"),
    route("week/:weekStart", "routes/students.$studentId.week.$weekStart.tsx"),
    // Narration routes
    route("narrations", "routes/students.$studentId.narrations._index.tsx"),
  ]),

  // Redirect routes
  route("week", "routes/week.tsx"),

  // Narration routes (top-level for cleaner URLs)
  route("narration/new", "routes/narration.new.tsx"),
  route("narration/:id", "routes/narration.$id.tsx"),
  route("narrations", "routes/narrations.tsx"),

  // Auth routes
  route("login", "routes/login.tsx"),
  route("magic", "routes/magic.tsx"),
  route("logout", "routes/logout.tsx"),

  // API routes
  route("api/toggle-completion", "routes/api.toggle-completion.tsx"),
  route("api/save-narration", "routes/api.save-narration.tsx"),
  route("api/select-option", "routes/api.select-option.tsx"),
] satisfies RouteConfig;
