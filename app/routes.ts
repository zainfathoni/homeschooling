import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("week", "routes/week.tsx"),
  route("week/:weekStart", "routes/week.$weekStart.tsx"),
  route("week/:weekStart/settings", "routes/week.$weekStart.settings.tsx"),
  route("login", "routes/login.tsx"),
  route("magic", "routes/magic.tsx"),
  route("logout", "routes/logout.tsx"),
  route("api/toggle-completion", "routes/api.toggle-completion.tsx"),
  route("api/select-option", "routes/api.select-option.tsx"),
  route("api/select-student", "routes/api.select-student.tsx"),
  route("api/save-narration", "routes/api.save-narration.tsx"),
  route("narration/new", "routes/narration.new.tsx"),
  route("narration/:id", "routes/narration.$id.tsx"),
  route("narrations", "routes/narrations.tsx"),
  route("narrations/:subjectId", "routes/narrations.$subjectId.tsx"),
] satisfies RouteConfig;
