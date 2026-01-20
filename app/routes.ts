import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("week", "routes/week.tsx"),
  route("week/:weekStart", "routes/week.$weekStart.tsx"),
  route("login", "routes/login.tsx"),
  route("magic", "routes/magic.tsx"),
  route("logout", "routes/logout.tsx"),
  route("api/toggle-completion", "routes/api.toggle-completion.tsx"),
  route("api/select-option", "routes/api.select-option.tsx"),
] satisfies RouteConfig;
