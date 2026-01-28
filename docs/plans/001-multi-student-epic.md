# Plan 001: Multi-Student Epic

**Status:** Complete  
**Created:** 2026-01-28  
**Author:** AI Assistant

## Overview

Enable the homeschool planner to support multiple students (Najmi age 11, Isa age 8) with independent subject lists and progress tracking. This is a foundational feature that unlocks per-student curriculum customization.

## Current State

- Single student hardcoded via `Current.user.students.first`
- Today view shows one student's subjects
- Report view shows one student's weekly progress
- No UI to switch between students

## Goal

- Student selector in Today and Report views
- Each student has independent subjects and completions
- Seed data with two students and sample curricula
- Foundation for future per-student customizations (scheduled days, pick1, narrations)

## User Stories

1. **As a parent**, I want to switch between my children's views so I can track each child's progress separately.
2. **As a parent**, I want each child to have their own subject list so their curricula can differ.
3. **As a parent**, I want to add/edit student profiles so I can manage my family's homeschool setup.

## Technical Design

### Database Changes

Add avatar field to students table:

```ruby
# Migration
add_column :students, :avatar_url, :string  # Optional custom avatar
add_column :students, :year_level, :integer  # Year 6, Year 3, etc.
```

Current schema already supports multiple students per user:

```ruby
# Already in place
User has_many :students
Student has_many :subjects
Subject has_many :completions
```

### Session State for Selected Student

Store selected student in session to persist across page navigation:

```ruby
# app/controllers/concerns/student_selection.rb
module StudentSelection
  extend ActiveSupport::Concern

  included do
    before_action :set_current_student
    helper_method :current_student
  end

  def current_student
    @current_student
  end

  private

  def set_current_student
    @current_student = if session[:student_id]
      Current.user.students.find_by(id: session[:student_id])
    end
    @current_student ||= Current.user.students.first
  end

  def select_student(student)
    session[:student_id] = student.id
    @current_student = student
  end
end
```

### Controller Changes

#### StudentsController (new)

```ruby
# POST /students/:id/select - Switch active student
# GET /students - List students (for management)
# POST /students - Create student
# PATCH /students/:id - Update student
# DELETE /students/:id - Delete student
```

#### TodayController

```ruby
def index
  @students = Current.user.students
  @student = current_student  # Uses concern
  @subjects = @student&.subjects&.includes(:completions) || []
  @date = Date.current
end
```

#### ReportsController

Same pattern—use `current_student` from concern.

### Routes

```ruby
resources :students, only: [:index, :new, :create, :edit, :update, :destroy] do
  member do
    post :select  # Switch active student
  end
end
```

### UI Components

#### Student Selector (Turbo Frame)

Location: `app/views/shared/_student_selector.html.erb`

```erb
<%= turbo_frame_tag "student_selector" do %>
  <div class="flex gap-2">
    <% @students.each do |student| %>
      <%= button_to select_student_path(student),
          method: :post,
          class: student == current_student ? "active" : "" do %>
        <span class="avatar"><%= student.name.first %></span>
        <span><%= student.name %></span>
      <% end %>
    <% end %>
  </div>
<% end %>
```

#### Student Management Page

Simple CRUD at `/students`:

- List students with edit/delete
- Add new student form
- Avatar/initial display

### Seed Data

```ruby
# db/seeds.rb
parent = User.find_or_create_by!(email: "parent@example.com") do |u|
  u.name = "Parent"
  u.password = "password123"
end

najmi = parent.students.find_or_create_by!(name: "Najmi")
isa = parent.students.find_or_create_by!(name: "Isa")

# Najmi's subjects (Year 6)
["Math", "English", "Science", "History", "Coding", "Islamic Studies", "Arabic"].each do |name|
  najmi.subjects.find_or_create_by!(name: name)
end

# Isa's subjects (Year 3)
["Math", "English", "Handwriting", "Science", "Islamic Studies", "Reading"].each do |name|
  isa.subjects.find_or_create_by!(name: name)
end
```

## UI/UX Design

### Student Selector Placement

**Mobile (< 768px):**

- Horizontal tabs at top of Today/Report views
- Pill-style buttons with student initials
- Active student highlighted with coral accent

**Tablet (≥ 768px):**

- Same tabs, larger touch targets
- Prepare for future Duet view integration

### Visual Design

```txt
┌─────────────────────────────────────┐
│  [N] Najmi    [I] Isa               │  ← Student tabs
├─────────────────────────────────────┤
│  Today - Wednesday, Jan 28          │
│  ┌─────────────────────────────────┐│
│  │ ☑ Math                          ││
│  │ ☐ English                       ││
│  │ ☐ Science                       ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### Colors (from design system)

- Active tab: `bg-coral text-white`
- Inactive tab: `bg-white text-gray-700 border`
- Background: `bg-lavender`

## Testing Strategy

### Model Tests

- Student belongs to user validation
- Student has many subjects
- Deleting student cascades to subjects and completions

### Controller Tests

- `StudentsController#select` switches session student
- `TodayController` uses selected student
- `ReportsController` uses selected student
- Unauthorized access to other users' students returns 404

### System Tests

- Click student tab → view switches
- Add new student → appears in selector
- Delete student → removed from selector, switches to first

## Task Breakdown

### Task 1: StudentSelection Concern

- Create `app/controllers/concerns/student_selection.rb`
- Include in ApplicationController
- Add `current_student` helper method
- Store/retrieve from session

### Task 2: StudentsController with Select Action

- Generate controller with CRUD actions
- Implement `select` action for switching
- Add routes
- Turbo Stream response for seamless switching

### Task 3: Student Selector UI Component

- Create `_student_selector.html.erb` partial
- Style with Tailwind (coral accent, pills)
- Turbo Frame for dynamic updates
- Include in Today and Report views

### Task 4: Student Management Views

- Index page listing students
- New/Edit forms
- Delete confirmation
- Link from main navigation

### Task 5: Enhanced Seed Data

- Two students (Najmi, Isa)
- Age-appropriate subjects for each
- Sample completions for demo

### Task 6: Update Today/Report Controllers

- Use `current_student` instead of `students.first`
- Pass `@students` for selector
- Handle no-student edge case

## Beads Issues Structure

```txt
hs-multi-student (epic)
├── hs-multi-student.1: StudentSelection concern
├── hs-multi-student.2: StudentsController with select action
├── hs-multi-student.3: Student selector UI component
├── hs-multi-student.4: Student management views (CRUD)
├── hs-multi-student.5: Enhanced seed data
└── hs-multi-student.6: Update Today/Report to use current_student
```

**Dependencies:**

- Task 1 blocks Tasks 2, 3, 6
- Task 2 blocks Task 3
- Tasks 4, 5 can run in parallel after Task 1

## Risks & Mitigations

| Risk                                             | Mitigation                           |
| ------------------------------------------------ | ------------------------------------ |
| Session doesn't persist across Turbo navigations | Use Rails session, not JS state      |
| Student deleted while selected                   | Auto-select first remaining student  |
| No students exist                                | Show "Add your first student" prompt |

## Success Criteria

- [x] Can switch between students with one click
- [x] Each student has independent subject list
- [x] Completions are per-student, per-subject, per-date
- [x] Student selector persists selection across page loads
- [x] Can add/edit/delete students
- [x] All tests pass
- [x] No rubocop violations

## Future Considerations

This epic lays groundwork for:

- **hs-subject-types**: Per-student scheduled days and pick1 options
- **hs-narrations**: Per-student narration entries
- **hs-weekly-grid**: Student-specific weekly view
- **hs-avatars**: Custom student avatars/photos

## References

- [PRODUCT_VISION.md](../PRODUCT_VISION.md) - Core requirements
- [ADR-0002](../decisions/0002-rails-for-simplicity-and-learning.md) - Rails architecture
- [Mockup: Mobile Weekly](../mockups/01-mobile-weekly-overview.png) - Student tabs design
