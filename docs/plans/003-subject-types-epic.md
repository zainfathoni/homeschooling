# Plan 003: Subject Types Epic

**Status:** ✅ Completed
**Created:** 2026-01-28
**Completed:** 2026-01-29
**Depends on:** [002-weekly-grid-epic](002-weekly-grid-epic.md) ✅

## Implementation Notes

All 8 tasks completed. Key implementations:
- Subject model with `subject_type` enum (fixed/scheduled/pick1), `scheduled_days` JSON, `active_on?(date)` method
- SubjectOption model for pick1 subjects with position ordering
- Completion model with optional `subject_option` reference for pick1 tracking
- Completion circles: solid (active), dashed (off-day), dotted (pick1 - needs Daily Focus)
- SubjectsController with full CRUD nested under students
- Progress calculation accounts for scheduled off-days

**Known limitation:** Pick1 subjects show dotted circles in weekly grid but are not clickable - they require the Daily Focus view (Epic 004/005) for option selection.

## Overview

Implement the three subject types from PRODUCT_VISION: fixed, scheduled, and pick1. This enables flexible curriculum configuration for different learning patterns.

## Subject Types

| Type | Behavior | Example | Grid Display |
|------|----------|---------|--------------|
| `fixed` | Active every day (Mon-Fri) | Math, Handwriting | Solid circle every day |
| `scheduled` | Active only on specific days | Coding (Mon-Thu) | Solid circle on active days, **dashed circle** on off-days |
| `pick1` | Choose one option per category | Islamic Study → Safar Book | Solid circle, tracks which option selected |

## Design Decisions

Based on user input:
- **Off-day visualization**: Dashed gray circle (not hidden, not grayed solid)
- **Pick1 tracking**: Track which option was selected each day
- **Type mutability**: Subject type is fixed at creation (cannot be changed later)

## UI References

- [Mockup: Mobile Weekly Overview](../mockups/01-mobile-weekly-overview.png) - Dashed circles on off-days
- [Mockup: Daily Focus](../mockups/02-mobile-daily-focus.png) - Pick1 selector UI

---

## Database Changes

### Migration 1: Add subject_type and scheduled_days

```ruby
class AddSubjectTypeToSubjects < ActiveRecord::Migration[8.1]
  def change
    add_column :subjects, :subject_type, :string, default: "fixed", null: false
    add_column :subjects, :scheduled_days, :json  # [0,1,2,3,4] where 0=Mon, 4=Fri
  end
end
```

### Migration 2: Create subject_options table

```ruby
class CreateSubjectOptions < ActiveRecord::Migration[8.1]
  def change
    create_table :subject_options do |t|
      t.references :subject, null: false, foreign_key: true
      t.string :name, null: false
      t.integer :position, default: 0  # for ordering

      t.timestamps
    end
  end
end
```

### Migration 3: Add selected_option to completions

```ruby
class AddSelectedOptionToCompletions < ActiveRecord::Migration[8.1]
  def change
    add_reference :completions, :subject_option, foreign_key: true
  end
end
```

---

## Model Specifications

### Subject Model Updates

```ruby
class Subject < ApplicationRecord
  belongs_to :student
  has_many :completions, dependent: :destroy
  has_many :subject_options, -> { order(:position) }, dependent: :destroy

  validates :name, presence: true
  validates :subject_type, inclusion: { in: %w[fixed scheduled pick1] }
  validates :scheduled_days, presence: true, if: :scheduled?

  enum :subject_type, { fixed: "fixed", scheduled: "scheduled", pick1: "pick1" }

  # Returns true if subject is active on the given date
  def active_on?(date)
    return true if fixed?
    return true if pick1?
    return false unless scheduled?

    day_of_week = date.wday  # 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
    # Convert to our format: 0=Mon, 4=Fri
    weekday_index = day_of_week == 0 ? nil : day_of_week - 1
    return false if weekday_index.nil? || weekday_index > 4  # Weekend

    scheduled_days&.include?(weekday_index)
  end

  accepts_nested_attributes_for :subject_options, allow_destroy: true,
                                reject_if: :all_blank
end
```

### SubjectOption Model

```ruby
class SubjectOption < ApplicationRecord
  belongs_to :subject
  has_many :completions, dependent: :nullify

  validates :name, presence: true
  validates :subject, presence: true

  default_scope { order(:position) }
end
```

### Completion Model Updates

```ruby
class Completion < ApplicationRecord
  belongs_to :subject
  belongs_to :subject_option, optional: true

  validates :date, presence: true
  validates :subject_option, presence: true, if: -> { subject&.pick1? }
end
```

---

## Component Specifications

### Completion Circle Updates: `app/views/today/_completion_circle.html.erb`

```erb
<%# locals: (subject:, date:, completed:, is_today:) %>
<%# Add: active parameter for scheduled subjects %>
<% active = subject.active_on?(date) %>

<%= turbo_frame_tag dom_id(subject, "circle_#{date}") do %>
  <% if active %>
    <%# Existing clickable circle code %>
    <%= button_to toggle_completion_path(...) do %>
      <span class="w-8 h-8 rounded-full border-2 ...">
        ...
      </span>
    <% end %>
  <% else %>
    <%# Dashed circle for off-days (not clickable) %>
    <div class="w-11 h-11 flex items-center justify-center">
      <span class="w-8 h-8 rounded-full border-2 border-dashed border-gray-300"></span>
    </div>
  <% end %>
<% end %>
```

### Pick1 Selector (for future Daily Focus): `app/views/daily/_pick1_selector.html.erb`

```erb
<%# locals: (subject:, date:, selected_option_id:) %>
<%= turbo_frame_tag dom_id(subject, "pick1_#{date}") do %>
  <div class="bg-white rounded-xl p-4 shadow-sm">
    <div class="flex items-center justify-between mb-3">
      <span class="text-sm text-gray-500">Pick 1</span>
      <span class="text-lg">📖</span>
    </div>
    <h3 class="font-medium text-gray-800 mb-3"><%= subject.name %></h3>

    <div class="space-y-2">
      <% subject.subject_options.each do |option| %>
        <%= button_to toggle_completion_path(subject_id: subject.id, date: date, option_id: option.id),
            method: :post,
            class: "w-full flex items-center gap-3 p-3 rounded-lg border
                   #{selected_option_id == option.id ? 'border-coral bg-coral/10' : 'border-gray-200'}" do %>
          <span class="w-5 h-5 rounded-full border-2 flex items-center justify-center
                      <%= selected_option_id == option.id ? 'border-coral' : 'border-gray-300' %>">
            <% if selected_option_id == option.id %>
              <span class="w-2.5 h-2.5 rounded-full bg-coral"></span>
            <% end %>
          </span>
          <span class="text-gray-700"><%= option.name %></span>
        <% end %>
      <% end %>
    </div>
  </div>
<% end %>
```

### Subject Form Type Selector: `app/views/subjects/_form.html.erb`

```erb
<div class="space-y-4">
  <%= form.label :subject_type, "Subject Type", class: "block text-sm font-medium text-gray-700" %>

  <div class="flex gap-2">
    <% %w[fixed scheduled pick1].each do |type| %>
      <%= form.radio_button :subject_type, type, class: "sr-only peer", id: "type_#{type}" %>
      <%= form.label "type_#{type}",
          class: "flex-1 py-2 px-4 text-center rounded-lg border-2 cursor-pointer
                 peer-checked:border-coral peer-checked:bg-coral/10" do %>
        <%= type.titleize %>
      <% end %>
    <% end %>
  </div>

  <%# Scheduled days picker (shown when scheduled selected) %>
  <div data-controller="subject-type" data-subject-type-target="scheduledDays"
       class="<%= 'hidden' unless subject.scheduled? %>">
    <%= form.label :scheduled_days, "Active Days", class: "block text-sm font-medium text-gray-700 mb-2" %>
    <div class="flex gap-2">
      <% %w[Mon Tue Wed Thu Fri].each_with_index do |day, index| %>
        <%= form.check_box :scheduled_days,
            { multiple: true, checked: subject.scheduled_days&.include?(index) },
            index, nil %>
        <%= form.label "scheduled_days_#{index}", day,
            class: "w-11 h-11 flex items-center justify-center rounded-lg border-2 cursor-pointer" %>
      <% end %>
    </div>
  </div>

  <%# Pick1 options (shown when pick1 selected) %>
  <div data-subject-type-target="pick1Options" class="<%= 'hidden' unless subject.pick1? %>">
    <%= form.label :subject_options, "Options", class: "block text-sm font-medium text-gray-700 mb-2" %>
    <%= form.fields_for :subject_options do |option_form| %>
      <div class="flex gap-2 mb-2">
        <%= option_form.text_field :name, class: "flex-1 rounded-lg border-gray-300" %>
        <%= option_form.check_box :_destroy, class: "hidden" %>
        <button type="button" class="text-red-500">✕</button>
      </div>
    <% end %>
    <button type="button" data-action="subject-type#addOption" class="text-coral text-sm">
      + Add option
    </button>
  </div>
</div>
```

---

## Controller Updates

### CompletionsController

```ruby
def toggle
  @subject = Subject.find(params[:subject_id])
  @date = Date.parse(params[:date])

  # Check if subject is active on this date
  unless @subject.active_on?(@date)
    head :unprocessable_entity
    return
  end

  authorize_subject!

  @completion = @subject.completions.find_or_initialize_by(date: @date)

  if @subject.pick1?
    handle_pick1_toggle
  else
    handle_standard_toggle
  end

  calculate_week_totals
  respond_to_toggle
end

private

def handle_pick1_toggle
  option_id = params[:option_id]

  if @completion.persisted? && @completion.subject_option_id == option_id.to_i
    # Clicking same option = uncomplete
    @completion.destroy
    @completed = false
  else
    # Select this option
    @completion.subject_option_id = option_id
    @completion.completed = true
    @completion.save!
    @completed = true
  end
end

def handle_standard_toggle
  if @completion.persisted?
    @completion.destroy
    @completed = false
  else
    @completion.completed = true
    @completion.save!
    @completed = true
  end
end
```

---

## Task Breakdown

### Task 1: Subject Type Migration & Model

Add subject_type enum and scheduled_days to Subject model.

**Files:**
- `db/migrate/xxx_add_subject_type_to_subjects.rb`
- `app/models/subject.rb`

**Acceptance Criteria:**
- Migration adds subject_type (string, default: "fixed") and scheduled_days (json)
- Subject model has enum for subject_type
- `active_on?(date)` method returns correct boolean
- Existing subjects default to "fixed" type
- Tests for model validations and methods

### Task 2: SubjectOption Model

Create SubjectOption model for pick1 subjects.

**Files:**
- `db/migrate/xxx_create_subject_options.rb`
- `app/models/subject_option.rb`
- `app/models/subject.rb` (add association)

**Acceptance Criteria:**
- SubjectOption belongs_to Subject
- Subject has_many subject_options
- Options are ordered by position
- accepts_nested_attributes_for works
- Tests for model

### Task 3: Completion Model Updates

Add selected option tracking for pick1 completions.

**Files:**
- `db/migrate/xxx_add_selected_option_to_completions.rb`
- `app/models/completion.rb`

**Acceptance Criteria:**
- Completion optionally belongs_to SubjectOption
- Validation requires option for pick1 subjects
- Tests for pick1 completion flow

### Task 4: Completion Circle - Scheduled Days

Update completion circle to show dashed circles on off-days.

**Files:**
- `app/views/today/_completion_circle.html.erb`
- `app/views/today/_weekly_grid.html.erb` (pass active status)

**Acceptance Criteria:**
- Fixed subjects: solid circle every day (existing behavior)
- Scheduled subjects: solid circle on active days, dashed circle on off-days
- Dashed circles are not clickable
- Tests for grid display

### Task 5: CompletionsController - Pick1 Support

Update toggle action to handle pick1 option selection.

**Files:**
- `app/controllers/completions_controller.rb`
- `app/views/completions/toggle.turbo_stream.erb`

**Acceptance Criteria:**
- Toggle with option_id param selects that option
- Clicking same option uncompletes
- Clicking different option switches selection
- Blocked if subject not active on date
- Tests for pick1 toggle flow

### Task 6: Subject Form - Type Selection

Update subject form to handle type selection and options.

**Files:**
- `app/views/subjects/_form.html.erb`
- `app/controllers/subjects_controller.rb`
- `app/javascript/controllers/subject_type_controller.js`

**Acceptance Criteria:**
- Radio buttons for fixed/scheduled/pick1
- Scheduled: show day picker (Mon-Fri checkboxes)
- Pick1: show options list with add/remove
- Stimulus controller shows/hides relevant fields
- Strong params permit nested attributes
- Tests for form submission

### Task 7: Weekly Grid Progress Calculation

Update progress calculation to account for scheduled subjects.

**Files:**
- `app/controllers/today_controller.rb`
- `app/controllers/completions_controller.rb`

**Acceptance Criteria:**
- Progress only counts active subjects for each day
- Weekly total = sum of active subjects per day
- Scheduled off-days don't count toward total
- Tests for progress calculation

### Task 8: Integration Tests

Comprehensive tests for all subject type flows.

**Files:**
- `test/system/subject_types_test.rb`
- `test/models/subject_test.rb`
- `test/controllers/completions_controller_test.rb`

**Acceptance Criteria:**
- Create each subject type via form
- Toggle completions for each type
- Verify grid displays correctly
- Verify progress calculations
- Pick1 option selection works

---

## Issue Hierarchy

```
hs-subject-types (EPIC)
├── hs-subject-types.1: Subject type migration & model
├── hs-subject-types.2: SubjectOption model
├── hs-subject-types.3: Completion model updates
├── hs-subject-types.4: Completion circle - scheduled days
├── hs-subject-types.5: CompletionsController - pick1 support
├── hs-subject-types.6: Subject form - type selection
├── hs-subject-types.7: Weekly grid progress calculation
└── hs-subject-types.8: Integration tests
```

## Dependencies

```
hs-subject-types.1 ─┬─► hs-subject-types.2 ─► hs-subject-types.3
                    └─► hs-subject-types.4

hs-subject-types.3 ─► hs-subject-types.5

hs-subject-types.1 ─► hs-subject-types.6
hs-subject-types.1 ─► hs-subject-types.7

All tasks ─► hs-subject-types.8
```

---

*Plan refined: 2026-01-28*
