# Plan 005: Responsive Navigation Epic

**Status:** Core Complete (enhancements pending)
**Created:** 2026-01-28
**Refined at:** 2026-01-30
**Updated:** 2026-01-31
**Depends on:** [002-weekly-grid-epic](002-weekly-grid-epic.md) ✅

## Overview

Implement responsive navigation with mobile bottom nav, Daily Focus view, and tablet Duet (split) view. This epic bridges the Weekly Grid (completed) with detailed daily task management.

## Responsive Breakpoints

| Breakpoint | Layout                                         |
| ---------- | ---------------------------------------------- |
| < 768px    | Mobile: single column, bottom nav              |
| ≥ 768px    | Tablet: Duet split view (60/40), no bottom nav |

## UI References

- [Mobile Daily Focus](../mockups/02-mobile-daily-focus.png)
- [iPad Duet View](../mockups/04-ipad-duet-view.png)

## Goal

- Daily Focus view showing tasks for selected day
- Mobile bottom navigation bar (Today, Week, Notes, Settings)
- Tablet Duet view: weekly grid + daily focus side-by-side
- Clickable day navigation in weekly grid
- Touch-friendly targets (44x44pt minimum)

---

## Component Specifications

### Daily Focus View: `app/views/daily/_focus.html.erb`

```erb
<%# locals: (student:, date:, subjects:, completions:) %>
<div class="bg-white rounded-xl p-4 shadow-sm">
  <header class="text-center mb-4">
    <p class="text-gray-600"><%= date.strftime("%A, %b %d") %></p>
    <%= render "daily/progress_ring", completed: completed_count, total: total_count %>
  </header>

  <div class="space-y-3">
    <% subjects.each do |subject| %>
      <%= render "daily/task_card", subject: subject, date: date, completed: completions.include?(subject.id) %>
    <% end %>
  </div>
</div>
```

### Progress Ring: `app/views/daily/_progress_ring.html.erb`

```erb
<%# locals: (completed:, total:) %>
<%= turbo_frame_tag "progress_ring" do %>
  <div class="relative w-20 h-20 mx-auto my-4">
    <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="16" fill="none" stroke="#E5E7EB" stroke-width="3"/>
      <circle cx="18" cy="18" r="16" fill="none" stroke="#F08080" stroke-width="3"
              stroke-dasharray="<%= percentage %>, 100" stroke-linecap="round"/>
    </svg>
    <div class="absolute inset-0 flex flex-col items-center justify-center">
      <span class="text-xl font-bold text-gray-800"><%= completed %>/<%= total %></span>
      <span class="text-xs text-gray-500">tasks</span>
    </div>
  </div>
<% end %>
```

### Task Card: `app/views/daily/_task_card.html.erb`

```erb
<%# locals: (subject:, date:, completed:, has_narration:) %>
<%= turbo_frame_tag dom_id(subject, "task_#{date}") do %>
  <%= button_to toggle_completion_path(subject_id: subject.id, date: date),
      method: :post,
      class: "w-full bg-white rounded-xl p-4 shadow-sm border-l-4 flex items-center gap-4
             #{completed ? 'border-coral' : 'border-gray-200'}" do %>
    <span class="w-11 h-11 rounded-lg border-2 flex items-center justify-center shrink-0
                <%= completed ? 'bg-coral border-coral' : 'border-gray-300' %>">
      <% if completed %>
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
        </svg>
      <% end %>
    </span>
    <div class="flex-1 text-left">
      <span class="text-lg font-medium text-gray-800 <%= 'line-through text-gray-400' if completed %>">
        <%= subject.name %>
      </span>
    </div>
  <% end %>
<% end %>
```

### Mobile Bottom Nav: `app/views/shared/_bottom_nav.html.erb`

```erb
<nav class="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 md:hidden">
  <div class="flex justify-around">
    <%= link_to today_path, class: "flex flex-col items-center py-3 px-4 min-w-[64px] #{active?('today') ? 'text-coral' : 'text-gray-500'}" do %>
      <svg class="w-6 h-6" ...><!-- Calendar icon --></svg>
      <span class="text-xs mt-1">Today</span>
    <% end %>
    <%= link_to week_path, class: "..." do %>
      <svg ...><!-- Grid icon --></svg>
      <span class="text-xs mt-1">Week</span>
    <% end %>
    <%= link_to notes_path, class: "..." do %>
      <svg ...><!-- Notes icon --></svg>
      <span class="text-xs mt-1">Notes</span>
    <% end %>
    <%= link_to settings_path, class: "..." do %>
      <svg ...><!-- Settings icon --></svg>
      <span class="text-xs mt-1">Settings</span>
    <% end %>
  </div>
</nav>
```

### Duet Layout: `app/views/layouts/_duet.html.erb`

```erb
<div class="hidden md:grid md:grid-cols-5 gap-4 h-screen p-4">
  <div class="col-span-3 overflow-auto">
    <%= yield :weekly_grid %>
  </div>
  <div class="col-span-2 overflow-auto">
    <%= turbo_frame_tag "daily_focus" do %>
      <%= yield :daily_focus %>
    <% end %>
  </div>
</div>
```

### Clickable Day Headers: Update `_weekly_grid.html.erb`

```erb
<%# In header row, make days clickable %>
<% dates.each do |date| %>
  <%= link_to daily_path(date: date),
      class: "w-11 h-11 flex items-center justify-center rounded-lg text-xs font-medium
             #{is_today ? 'bg-coral text-white' : 'hover:bg-gray-100 text-gray-500'}",
      data: { turbo_frame: "daily_focus" } do %>
    <%= date.strftime("%a")[0..1] %>
  <% end %>
<% end %>
```

---

## Routing Changes

```ruby
# config/routes.rb changes
get "today", to: "daily#show", as: :today       # Daily Focus (current day)
get "daily/:date", to: "daily#show", as: :daily # Daily Focus (specific date)
get "week", to: "today#index", as: :week        # Weekly Grid (rename from /today)
get "notes", to: redirect { |_, req| "/students/#{req.session[:student_id]}/narrations" }
get "settings", to: "settings#index", as: :settings
```

---

## Task Breakdown

### Task 1: Daily Focus Controller & View

Create the Daily Focus view infrastructure.

**Files:**

- `app/controllers/daily_controller.rb`
- `app/views/daily/show.html.erb`
- `app/views/daily/_focus.html.erb`

**Acceptance Criteria:**

- GET `/today` shows current day's tasks
- GET `/daily/2026-01-28` shows specific day's tasks
- Redirects to student selection if no student
- Uses StudentSelection concern
- Displays date header and task list
- Works with existing subject/completion models

### Task 2: Progress Ring Component

Create circular progress indicator for Daily Focus.

**Files:**

- `app/views/daily/_progress_ring.html.erb`

**Acceptance Criteria:**

- SVG-based circular progress
- Shows X/Y tasks completed
- Wrapped in turbo_frame for updates
- Coral (#F08080) progress color

### Task 3: Task Card Component

Create detailed task card with checkbox for Daily Focus.

**Files:**

- `app/views/daily/_task_card.html.erb`

**Acceptance Criteria:**

- 44px touch target checkbox
- Left border accent (coral when complete)
- Subject name with strikethrough when complete
- Button posts to toggle_completion_path
- Wrapped in turbo_frame for instant updates
- Narration indicator: "✓ narrated" (green) or "+ add narration" (coral link)
- Match pattern from \_weekly_grid.html.erb:23-37

### Task 4: Update Turbo Streams for Daily Focus

Extend completion toggle to update Daily Focus components.

**Files:**

- `app/views/completions/toggle.turbo_stream.erb` (update)

**Acceptance Criteria:**

- Updates task card in Daily Focus
- Updates progress ring
- Continues to update weekly grid circle
- All three views stay in sync

### Task 5: Mobile Bottom Navigation

Create fixed bottom navigation for mobile.

**Files:**

- `app/views/shared/_bottom_nav.html.erb`
- `app/helpers/navigation_helper.rb`
- `app/views/layouts/application.html.erb` (update)

**Acceptance Criteria:**

- Fixed to bottom on mobile (< 768px)
- Hidden on tablet (≥ 768px)
- Four items: Today, Week, Notes, Settings
- Active state highlighting
- 44px minimum touch targets

### Task 6: Responsive Layout Wrapper

Create layout that switches between mobile and Duet views.

**Files:**

- `app/views/layouts/_duet.html.erb`
- `app/views/layouts/application.html.erb` (update)
- `app/assets/stylesheets/application.css` (update if needed)

**Acceptance Criteria:**

- Mobile: single column with bottom nav
- Tablet: 60/40 split grid
- Smooth responsive transition
- Padding for bottom nav on mobile

### Task 7: Clickable Day Navigation

Make day headers in weekly grid navigate to Daily Focus.

**Files:**

- `app/views/today/_weekly_grid.html.erb` (update)

**Acceptance Criteria:**

- Day labels are 44px touch targets
- Clicking navigates to that day's Daily Focus
- On tablet: updates right panel via Turbo Frame
- On mobile: full page navigation
- Current day highlighted in coral

### Task 8: Integration & System Tests

Wire everything together and add comprehensive tests.

**Files:**

- `app/views/today/index.html.erb` (update)
- `test/system/responsive_navigation_test.rb`
- `test/controllers/daily_controller_test.rb`

**Acceptance Criteria:**

- Mobile flow: bottom nav switches views
- Tablet flow: Duet view with synced panels
- Day click updates Daily Focus
- Completion toggle updates all visible components
- Tests cover both breakpoints

### Task 9: Settings Stub Page

Create placeholder Settings page for bottom navigation.

**Files:**

- `app/controllers/settings_controller.rb`
- `app/views/settings/index.html.erb`

**Acceptance Criteria:**

- GET `/settings` renders placeholder page
- Shows "Settings coming soon" message
- Matches app styling (lavender background, white card)

---

## Issue Hierarchy

```txt
hs-nav (EPIC)
├── hs-nav.1: Daily Focus controller & routes ✅
├── hs-nav.2: Progress ring component ✅
├── hs-nav.3: Task card with narration indicator ✅
├── hs-nav.4: Turbo Stream updates for Daily Focus ✅
├── hs-nav.5: Mobile bottom navigation ✅
├── hs-nav.6: Responsive Duet layout wrapper ✅
├── hs-nav.7: Clickable day navigation ✅
├── hs-nav.8: Integration & system tests ✅
└── hs-nav.9: Settings stub page ✅
```

### Additional Issues (discovered during implementation)

```txt
hs-nav.10: [BUG] Weekly grid checkbox doesn't update Daily Focus panel ✅
           Fixed duplicate IDs in duet layout; refactored to single render with CSS

hs-nav.11: [BUG] Pick1 selector component for Daily Focus ✅
           Created _pick1_selector.html.erb with radio options for pick1 subjects

hs-nav.12: [FEATURE] Weekly grid shows pick1 current selection (P3)
           Display which option was selected in the weekly grid circles

hs-nav.13: [FEATURE] Quick notes input with voice option (P3)
           Add quick note capture UI with voice recording support

hs-nav.14: [FEATURE] 'Not today' label for scheduled subjects (P4)
           Show inactive scheduled subjects with visual indicator

hs-nav.15: [TASK] Narration form shows selected Pick1 option (P2)
           Pass option_id to narration link; display in form
```

## Dependencies

```txt
hs-nav.1 ─┬─► hs-nav.2 ─┬─► hs-nav.4 ─► hs-nav.8
          ├─► hs-nav.3 ─┘
          └─► hs-nav.7 ────────────────► hs-nav.8

hs-nav.5 ─► hs-nav.6 ─► hs-nav.8
                   ▲
hs-nav.9 ─────────┘
```

## Open Questions (Resolved)

- **Navigation state in Duet view?** → Use Turbo Frames for right panel
- **Animate transitions?** → Defer to future enhancement
- **PWA considerations?** → Out of scope for this epic

---
