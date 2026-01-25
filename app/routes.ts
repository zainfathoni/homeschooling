import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),

  // Nested student routes
  route("students/:studentId", "routes/students.$studentId.tsx", [
    // Week routes
    route("week", "routes/students.$studentId.week._index.tsx"),
    route("week/:weekStart", "routes/students.$studentId.week.$weekStart.tsx"),
  ]),

  // Auth routes
  route("login", "routes/login.tsx"),
  route("magic", "routes/magic.tsx"),
  route("logout", "routes/logout.tsx"),

  // API routes
  route("api/toggle-completion", "routes/api.toggle-completion.tsx"),
] satisfies RouteConfig;
