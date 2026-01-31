---
id: "002"
title: Weekly Grid Epic
status: ready
created: 2026-01-28
refined: 2026-01-28
depends_on: "001"
---

## Overview

Transform the Today view into a Weekly Grid showing all subjects as rows and weekdays (Mon-Fri) as columns. Each cell displays completion status, enabling at-a-glance weekly tracking.

## Goal

- Weekly grid: subjects as rows, days (Mon-Fri) as columns
- Visual completion tracking with circular status indicators
- Highlight current day with vertical column accent
- Weekly progress bar with percentage at top
- Day selector pills for mobile navigation

## User Stories

1. **As a parent**, I want to see the entire week's completion status at a glance so I can track progress without clicking into each day.
2. **As a parent**, I want to toggle completion for any day in the week so I can mark work done retroactively or in advance.
3. **As a parent**, I want the current day highlighted so I can quickly focus on today's tasks.
4. **As a parent**, I want to see weekly completion percentage so I know overall progress.

## UI Reference

- [Mockup: Mobile Weekly Overview](../mockups/01-mobile-weekly-overview.png)
- [Mockup: iPad Duet View](../mockups/04-ipad-duet-view.png)

## Technical Design

### Route Changes

Keep `/today` route but render weekly grid:

```ruby
# No route changes needed - reuse today#index
# Weekly grid replaces the daily list view
```

### Controller Changes

#### TodayController

```ruby
class TodayController < ApplicationController
  def index
    @students = Current.user.students
    @student = current_student
    @date = Date.current
    @week_start = @date.beginning_of_week(:monday)
    @week_end = @week_start + 4.days  # Mon-Fri
    @dates = (@week_start..@week_end).to_a

    if @student
      @subjects = @student.subjects.includes(:completions)
      # Eager load only this week's completions for efficiency
      @week_completions = Completion.joins(:subject)
                                    .where(subjects: { student_id: @student.id })
                                    .where(date: @week_start..@week_end)
                                    .pluck(:subject_id, :date)
                                    .group_by(&:first)
                                    .transform_values { |v| v.map(&:last).to_set }
    else
      @subjects = []
      @week_completions = {}
    end

    @total_possible = @subjects.count * @dates.count
    @total_completed = @week_completions.values.sum(&:size)
  end
end
```

### View Components

#### Main View: `app/views/today/index.html.erb`

```erb
<div class="min-h-screen bg-lavender p-4">
  <header class="mb-4">
    <p class="text-sm text-gray-500">Week of</p>
    <h1 class="text-xl font-bold text-gray-800">
      <%= @week_start.strftime("%b %d") %> - <%= @week_end.strftime("%b %d") %>
    </h1>
  </header>

  <%= render "shared/student_selector" %>

  <% if @student %>
    <%= render "today/progress_bar",
        completed: @total_completed,
        total: @total_possible %>

    <%= render "today/day_selector", dates: @dates, current_date: @date %>

    <%= render "today/weekly_grid",
        subjects: @subjects,
        dates: @dates,
        week_completions: @week_completions,
        current_date: @date %>
  <% else %>
    <div class="bg-white rounded-xl p-6 text-center text-gray-500">
      No student found. Add a student to get started.
    </div>
  <% end %>
</div>
```

#### Progress Bar: `app/views/today/_progress_bar.html.erb`

```erb
<%# locals: (completed:, total:) %>
<% percentage = total > 0 ? (completed * 100.0 / total).round : 0 %>
<div class="bg-white rounded-xl p-4 shadow-sm mb-4">
  <div class="flex justify-between items-center mb-2">
    <span class="text-sm text-gray-600">Weekly Completion</span>
    <span class="text-sm font-bold text-coral"><%= percentage %>%</span>
  </div>
  <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
    <div class="h-full bg-coral rounded-full transition-all duration-300"
         style="width: <%= percentage %>%"></div>
  </div>
</div>
```

#### Day Selector: `app/views/today/_day_selector.html.erb`

```erb
<%# locals: (dates:, current_date:) %>
<div class="flex justify-between mb-4 gap-1">
  <% dates.each do |date| %>
    <% is_today = date == current_date %>
    <div class="flex-1 text-center py-2 rounded-lg text-sm font-medium
                <%= is_today ? 'bg-coral text-white' : 'bg-white text-gray-600' %>">
      <%= date.strftime("%a")[0..1] %>
    </div>
  <% end %>
</div>
```

#### Weekly Grid: `app/views/today/_weekly_grid.html.erb`

```erb
<%# locals: (subjects:, dates:, week_completions:, current_date:) %>
<div class="space-y-3">
  <% subjects.each do |subject| %>
    <div class="bg-white rounded-xl p-4 shadow-sm">
      <div class="flex items-center gap-3">
        <!-- Subject icon/name -->
        <div class="w-10 h-10 rounded-lg bg-lavender flex items-center justify-center shrink-0">
          <span class="text-lg">📚</span>
        </div>
        <span class="flex-1 font-medium text-gray-800 truncate">
          <%= subject.name %>
        </span>

        <!-- 5-day completion indicators -->
        <div class="flex gap-2">
          <% subject_completions = week_completions[subject.id] || Set.new %>
          <% dates.each do |date| %>
            <% completed = subject_completions.include?(date) %>
            <% is_today = date == current_date %>
            <%= render "today/completion_circle",
                subject: subject,
                date: date,
                completed: completed,
                is_today: is_today %>
          <% end %>
        </div>
      </div>
    </div>
  <% end %>
</div>
```

#### Completion Circle: `app/views/today/_completion_circle.html.erb`

```erb
<%# locals: (subject:, date:, completed:, is_today:) %>
<%= turbo_frame_tag dom_id(subject, "day_#{date}") do %>
  <%= button_to toggle_completion_path(subject_id: subject.id, date: date),
      method: :post,
      class: "w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer
             #{completed ? 'bg-coral' : is_today ? 'border-2 border-coral' : 'border border-gray-300'}",
      data: { turbo_frame: dom_id(subject, "day_#{date}") } do %>
    <% if completed %>
      <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
      </svg>
    <% end %>
  <% end %>
<% end %>
```

#### Turbo Stream Response: `app/views/completions/toggle.turbo_stream.erb`

Update to support multiple frame IDs:

```erb
<%= turbo_stream.replace dom_id(@subject, "day_#{@date}") do %>
  <%= render "today/completion_circle",
      subject: @subject,
      date: @date,
      completed: @subject.completions.exists?(date: @date),
      is_today: @date == Date.current %>
<% end %>

<%# Also update progress bar %>
<%= turbo_stream.replace "progress_bar" do %>
  <% week_start = Date.current.beginning_of_week(:monday) %>
  <% week_end = week_start + 4.days %>
  <% total = current_student.subjects.count * 5 %>
  <% completed = Completion.joins(:subject)
                           .where(subjects: { student_id: current_student.id })
                           .where(date: week_start..week_end).count %>
  <%= render "today/progress_bar", completed: completed, total: total %>
<% end %>
```

### Helper Methods

Add to `ApplicationHelper` or create `WeekHelper`:

```ruby
# app/helpers/week_helper.rb
module WeekHelper
  def week_dates(date = Date.current)
    start = date.beginning_of_week(:monday)
    (start..(start + 4.days)).to_a
  end

  def week_label(start_date, end_date)
    if start_date.month == end_date.month
      "#{start_date.strftime('%b %d')} - #{end_date.day}"
    else
      "#{start_date.strftime('%b %d')} - #{end_date.strftime('%b %d')}"
    end
  end
end
```

## Design Decisions

### Week Start: Monday

Aligns with typical homeschool schedules and Australian school week.

### Merge Today into Weekly

The Today view becomes the Weekly Grid. The daily list is replaced entirely - users can tap any day's circle to toggle completion. No separate "Today" view needed.

### Progress Bar Scope

Shows weekly progress (Mon-Fri), not daily. Updates via Turbo Stream when completions change.

### Mobile vs Tablet

- **Mobile (<768px)**: Vertical subject list with compact 5-circle row
- **Tablet (≥768px)**: Same layout for now; Duet view is a future enhancement

## Task Breakdown

### Task 1: Week Helper Methods

- Create `app/helpers/week_helper.rb`
- Add `week_dates(date)` method returning Mon-Fri array
- Add `week_label(start, end)` for header display
- Unit tests for edge cases (week boundaries, months)

### Task 2: Update TodayController for Weekly Data

- Calculate `@week_start`, `@week_end`, `@dates`
- Eager load week's completions efficiently
- Calculate `@total_possible` and `@total_completed`
- Add controller tests

### Task 3: Progress Bar Partial

- Create `app/views/today/_progress_bar.html.erb`
- Display percentage and visual bar
- Wrap in turbo_frame for dynamic updates
- Tailwind styling per design system

### Task 4: Day Selector Partial

- Create `app/views/today/_day_selector.html.erb`
- 5 pills for Mon-Fri
- Highlight current day with coral background
- Non-interactive (visual only for now)

### Task 5: Weekly Grid Partial

- Create `app/views/today/_weekly_grid.html.erb`
- Subject rows with 5 completion circles
- Subject icon placeholder (emoji for now)
- Responsive layout

### Task 6: Completion Circle Component

- Create `app/views/today/_completion_circle.html.erb`
- Three states: completed (coral fill), today (coral outline), inactive (gray outline)
- Turbo Frame for individual cell updates
- Button to toggle completion

### Task 7: Update Turbo Stream Response

- Update `toggle.turbo_stream.erb` to refresh circle
- Add progress bar refresh
- Test Turbo Stream responses

### Task 8: Update Main View

- Refactor `app/views/today/index.html.erb`
- Compose new partials
- Remove old checkbox list
- System tests for weekly grid interactions

## Testing Strategy

### Unit Tests

- `WeekHelper#week_dates` returns correct 5-day range
- `WeekHelper#week_dates` handles week boundaries correctly
- `WeekHelper#week_label` formats cross-month weeks

### Controller Tests

- `TodayController#index` loads week data
- `TodayController#index` calculates progress correctly
- `CompletionsController#toggle` works for any date in week

### System Tests

- View weekly grid with all subjects
- Toggle completion for today
- Toggle completion for past day
- Progress bar updates after toggle
- Current day is highlighted
- Student switcher updates grid

## Edge Cases

| Case                   | Handling                        |
| ---------------------- | ------------------------------- |
| No subjects            | Show empty state message        |
| No students            | Show "Add student" prompt       |
| Sunday/Saturday access | Show current week (Mon-Fri)     |
| Week spans months      | Display "Jan 27 - Feb 1" format |
| Many subjects          | Scrollable list                 |

## Success Criteria

- [ ] Weekly grid shows all subjects as rows
- [ ] 5-day columns (Mon-Fri) with completion circles
- [ ] Current day highlighted with coral outline
- [ ] Toggling completion updates circle immediately
- [ ] Progress bar shows weekly percentage
- [ ] Progress bar updates on completion toggle
- [ ] Student selector switches grid data
- [ ] All tests pass
- [ ] No rubocop violations

## Beads Issues Structure

```txt
hs-weekly-grid (epic)
├── hs-weekly-grid.1: Week helper methods
├── hs-weekly-grid.2: TodayController weekly data
├── hs-weekly-grid.3: Progress bar partial
├── hs-weekly-grid.4: Day selector partial
├── hs-weekly-grid.5: Weekly grid partial
├── hs-weekly-grid.6: Completion circle component
├── hs-weekly-grid.7: Turbo Stream updates
└── hs-weekly-grid.8: Main view integration & tests
```

**Dependencies:**

- Task 1 → Task 2 (helper needed for controller)
- Task 2 → Tasks 3, 4, 5 (data needed for views)
- Task 6 → Task 7 (circle needed for stream)
- Tasks 3-7 → Task 8 (all partials needed for integration)

## Future Enhancements

- Week navigation (prev/next week)
- Subject icons (customizable)
- Tablet Duet view (grid + daily detail)
- Scheduled days (grayed out unavailable days)
- Pick1 subject indicators
