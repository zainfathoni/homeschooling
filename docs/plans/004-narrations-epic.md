# Plan 004: Narrations Epic

**Status:** Ready for Implementation
**Created:** 2026-01-28
**Refined:** 2026-01-29
**Depends on:** [001-multi-student-epic](001-multi-student-epic.md) ✅

## Overview

Capture learning evidence as narrations—text, voice recordings, or photos—linked to student, subject, and date. Every narration must belong to a subject (no standalone narrations).

## Goal

- Narration model linked to student/subject/date (subject required)
- Three narration types: text, voice, photo
- Subject-level `narration_required` flag with soft enforcement
- Narration list view with filtering
- Quick narration input from subject cards

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Subject linking | **Always linked** | Every narration belongs to a subject—no standalone narrations |
| Voice capture | **Native input** for MVP | `<input type="file" accept="audio/*" capture="microphone">` triggers iOS/Android native recorder. Web Audio API deferred to later enhancement |
| Photo capture | **Native input** | `<input type="file" accept="image/*" capture="environment">` triggers camera/gallery |
| File storage | **Active Storage + local disk** | Can migrate to S3 later without code changes |
| Required narrations | **Soft enforcement** | Confirmation modal when completing subject without required narration |

## Narration Types

| Type | Capture Method | Display | Storage |
|------|----------------|---------|---------|
| Text | Textarea input | Formatted text | `content` column |
| Voice | Native file input with audio/* | Audio player with controls | Active Storage blob |
| Photo | Native file input with image/* | Responsive image thumbnail | Active Storage blob |

## UI References

- [Mockup: Notes & Narrations](../mockups/03-mobile-notes.png)
- [Mockup: Daily Focus](../mockups/02-mobile-daily-focus.png) - "Narration Required" badge

---

## Database Changes

### Migration 1: Create narrations table

```ruby
class CreateNarrations < ActiveRecord::Migration[8.1]
  def change
    create_table :narrations do |t|
      t.references :student, null: false, foreign_key: true
      t.references :subject, null: false, foreign_key: true
      t.date :date, null: false
      t.string :narration_type, null: false  # text, voice, photo
      t.text :content  # text narration content (null for voice/photo)

      t.timestamps
    end

    add_index :narrations, [:student_id, :date]
    add_index :narrations, [:subject_id, :date]
  end
end
```

### Migration 2: Add narration_required to subjects

```ruby
class AddNarrationRequiredToSubjects < ActiveRecord::Migration[8.1]
  def change
    add_column :subjects, :narration_required, :boolean, default: false, null: false
  end
end
```

---

## Model Specifications

### Narration Model

```ruby
class Narration < ApplicationRecord
  belongs_to :student
  belongs_to :subject

  has_one_attached :media  # voice or photo attachment

  validates :date, presence: true
  validates :narration_type, presence: true, inclusion: { in: %w[text voice photo] }
  validates :content, presence: true, if: :text?
  validates :media, presence: true, if: -> { voice? || photo? }
  validate :student_matches_subject

  enum :narration_type, { text: "text", voice: "voice", photo: "photo" }

  scope :for_date, ->(date) { where(date: date) }
  scope :for_student, ->(student) { where(student: student) }
  scope :for_subject, ->(subject) { where(subject: subject) }
  scope :recent, -> { order(created_at: :desc) }

  private

  def student_matches_subject
    return unless subject.present? && student.present?
    errors.add(:subject, "must belong to the same student") if subject.student_id != student_id
  end
end
```

### Subject Model Updates

```ruby
class Subject < ApplicationRecord
  # ... existing code ...
  has_many :narrations, dependent: :destroy

  # New method for soft enforcement
  def has_narration_for?(date)
    narrations.for_date(date).exists?
  end
end
```

### Student Model Updates

```ruby
class Student < ApplicationRecord
  # ... existing code ...
  has_many :narrations, dependent: :destroy
end
```

---

## Component Specifications

### Narration Form: `app/views/narrations/_form.html.erb`

```erb
<%# locals: (narration:, subject:) %>
<%= turbo_frame_tag dom_id(narration) do %>
  <%= form_with model: [subject.student, narration], class: "space-y-4" do |f| %>
    <%= f.hidden_field :subject_id, value: subject.id %>
    <%= f.hidden_field :date, value: narration.date || Date.current %>

    <%# Type selector %>
    <div class="flex gap-2" data-controller="narration-type">
      <% %w[text voice photo].each do |type| %>
        <%= f.radio_button :narration_type, type,
            data: { action: "narration-type#selectType", narration_type_target: "radio" },
            class: "sr-only peer", id: "narration_type_#{type}" %>
        <label for="narration_type_#{type}"
               class="flex-1 py-3 px-4 text-center rounded-xl border-2 cursor-pointer
                      peer-checked:border-coral peer-checked:bg-coral/10 transition-colors">
          <span class="text-lg"><%= { "text" => "📝", "voice" => "🎙️", "photo" => "📷" }[type] %></span>
          <span class="block text-sm text-gray-600 mt-1"><%= type.titleize %></span>
        </label>
      <% end %>
    </div>

    <%# Text input %>
    <div data-narration-type-target="textInput" class="<%= 'hidden' unless narration.text? || narration.new_record? %>">
      <%= f.text_area :content, rows: 4, placeholder: "What did you learn today?",
          class: "w-full rounded-xl border-gray-300 focus:border-coral focus:ring-coral" %>
    </div>

    <%# Voice input %>
    <div data-narration-type-target="voiceInput" class="hidden">
      <%= f.file_field :media, accept: "audio/*", capture: "microphone",
          class: "w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                  file:bg-coral file:text-white file:cursor-pointer" %>
      <p class="text-sm text-gray-500 mt-2">Tap to start recording</p>
    </div>

    <%# Photo input %>
    <div data-narration-type-target="photoInput" class="hidden">
      <%= f.file_field :media, accept: "image/*", capture: "environment",
          class: "w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                  file:bg-coral file:text-white file:cursor-pointer" %>
      <p class="text-sm text-gray-500 mt-2">Take a photo or choose from gallery</p>
    </div>

    <%= f.submit "Save Narration", class: "w-full py-3 bg-coral text-white rounded-xl font-medium" %>
  <% end %>
<% end %>
```

### Narration Card: `app/views/narrations/_narration.html.erb`

```erb
<%# locals: (narration:) %>
<%= turbo_frame_tag dom_id(narration) do %>
  <div class="bg-white rounded-xl p-4 shadow-sm">
    <div class="flex items-start justify-between mb-2">
      <div>
        <span class="text-sm text-gray-500"><%= narration.subject.name %></span>
        <span class="text-xs text-gray-400 ml-2"><%= narration.date.strftime("%b %d") %></span>
      </div>
      <span class="text-lg">
        <%= { "text" => "📝", "voice" => "🎙️", "photo" => "📷" }[narration.narration_type] %>
      </span>
    </div>

    <% case narration.narration_type %>
    <% when "text" %>
      <p class="text-gray-800 whitespace-pre-wrap"><%= narration.content %></p>
    <% when "voice" %>
      <audio controls class="w-full" src="<%= url_for(narration.media) %>">
        Your browser does not support audio playback.
      </audio>
    <% when "photo" %>
      <%= image_tag narration.media, class: "w-full rounded-lg", loading: "lazy" %>
    <% end %>

    <div class="flex gap-2 mt-3 pt-3 border-t border-gray-100">
      <%= link_to "Edit", edit_student_narration_path(narration.student, narration),
          class: "text-sm text-gray-500 hover:text-coral" %>
      <%= button_to "Delete", student_narration_path(narration.student, narration),
          method: :delete, class: "text-sm text-gray-500 hover:text-red-500",
          data: { turbo_confirm: "Delete this narration?" } %>
    </div>
  </div>
<% end %>
```

### Soft Enforcement Modal: `app/views/completions/_narration_reminder.html.erb`

```erb
<%# locals: (subject:, date:) %>
<div data-controller="modal" data-modal-open-value="true"
     class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
  <div class="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl">
    <div class="text-center mb-4">
      <span class="text-4xl">📝</span>
      <h3 class="text-lg font-semibold text-gray-800 mt-2">Add a Narration?</h3>
      <p class="text-gray-600 mt-2">
        <strong><%= subject.name %></strong> suggests adding a narration.
        Would you like to add one now?
      </p>
    </div>

    <div class="space-y-3">
      <%= link_to new_student_narration_path(subject.student, subject_id: subject.id, date: date),
          class: "block w-full py-3 bg-coral text-white text-center rounded-xl font-medium" do %>
        Add Narration
      <% end %>

      <%= button_tag "Skip for Now", type: "button",
          data: { action: "modal#close" },
          class: "w-full py-3 text-gray-500 text-center rounded-xl border border-gray-200" %>
    </div>
  </div>
</div>
```

### Subject Form Update: `app/views/subjects/_form.html.erb`

Add narration_required checkbox:

```erb
<%# Add after subject type selection %>
<div class="flex items-center gap-3 py-3">
  <%= form.check_box :narration_required, class: "w-5 h-5 rounded border-gray-300 text-coral focus:ring-coral" %>
  <%= form.label :narration_required, class: "text-gray-700" do %>
    <span class="font-medium">Require narration</span>
    <span class="block text-sm text-gray-500">Prompt for narration when completing this subject</span>
  <% end %>
</div>
```

### Quick Add Button: `app/views/today/_subject_row.html.erb`

```erb
<%# Add narration quick-add link in subject row %>
<% if subject.narration_required %>
  <%= link_to new_student_narration_path(subject.student, subject_id: subject.id, date: @date),
      class: "text-coral text-sm hover:underline", data: { turbo_frame: "modal" } do %>
    + Add narration
  <% end %>
<% end %>
```

---

## Controller Specifications

### NarrationsController

```ruby
class NarrationsController < ApplicationController
  before_action :set_student
  before_action :set_narration, only: [:show, :edit, :update, :destroy]

  def index
    @narrations = @student.narrations.includes(:subject).recent

    # Optional filters
    @narrations = @narrations.for_date(params[:date]) if params[:date].present?
    @narrations = @narrations.for_subject(params[:subject_id]) if params[:subject_id].present?
  end

  def new
    @narration = @student.narrations.build(
      date: params[:date] || Date.current,
      subject_id: params[:subject_id],
      narration_type: "text"
    )
    @subject = Subject.find(params[:subject_id]) if params[:subject_id]
  end

  def create
    @narration = @student.narrations.build(narration_params)

    if @narration.save
      respond_to do |format|
        format.html { redirect_to student_narrations_path(@student), notice: "Narration saved!" }
        format.turbo_stream
      end
    else
      @subject = @narration.subject
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    @subject = @narration.subject
  end

  def update
    if @narration.update(narration_params)
      respond_to do |format|
        format.html { redirect_to student_narrations_path(@student), notice: "Narration updated!" }
        format.turbo_stream
      end
    else
      @subject = @narration.subject
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @narration.destroy
    respond_to do |format|
      format.html { redirect_to student_narrations_path(@student), notice: "Narration deleted." }
      format.turbo_stream { render turbo_stream: turbo_stream.remove(@narration) }
    end
  end

  private

  def set_student
    @student = Student.find(params[:student_id])
  end

  def set_narration
    @narration = @student.narrations.find(params[:id])
  end

  def narration_params
    params.require(:narration).permit(:subject_id, :date, :narration_type, :content, :media)
  end
end
```

### CompletionsController Update (Soft Enforcement)

```ruby
def toggle
  # ... existing toggle logic ...

  # After successful completion, check for narration requirement
  if @completed && @subject.narration_required && !@subject.has_narration_for?(@date)
    @show_narration_reminder = true
  end

  respond_to_toggle
end
```

---

## Stimulus Controllers

### narration_type_controller.js

```javascript
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["radio", "textInput", "voiceInput", "photoInput"]

  selectType(event) {
    const type = event.target.value

    // Hide all inputs
    this.textInputTarget.classList.add("hidden")
    this.voiceInputTarget.classList.add("hidden")
    this.photoInputTarget.classList.add("hidden")

    // Show selected input
    switch(type) {
      case "text":
        this.textInputTarget.classList.remove("hidden")
        break
      case "voice":
        this.voiceInputTarget.classList.remove("hidden")
        break
      case "photo":
        this.photoInputTarget.classList.remove("hidden")
        break
    }
  }
}
```

### modal_controller.js

```javascript
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = { open: Boolean }

  close() {
    this.element.remove()
  }

  // Close on escape key
  keydown(event) {
    if (event.key === "Escape") this.close()
  }

  // Close on backdrop click
  backdropClick(event) {
    if (event.target === this.element) this.close()
  }
}
```

---

## Routes

```ruby
Rails.application.routes.draw do
  resources :students do
    resources :subjects
    resources :narrations
  end
end
```

---

## Task Breakdown

### Task 1: Narration Model & Migration

Create Narration model with required subject reference and Active Storage attachment.

**Files:**
- `db/migrate/xxx_create_narrations.rb`
- `app/models/narration.rb`
- `app/models/student.rb` (add association)
- `app/models/subject.rb` (add association)
- `test/models/narration_test.rb`

**Acceptance Criteria:**
- Migration creates narrations table with student, subject, date, narration_type, content
- Narration belongs_to student (required) and subject (required)
- has_one_attached :media for voice/photo
- Enum for narration_type (text, voice, photo)
- Validation: student must match subject's student
- Scopes: for_date, for_student, for_subject, recent
- Tests for model validations and associations

### Task 2: Text Narration CRUD

Basic narration management with text type.

**Files:**
- `app/controllers/narrations_controller.rb`
- `app/views/narrations/index.html.erb`
- `app/views/narrations/new.html.erb`
- `app/views/narrations/edit.html.erb`
- `app/views/narrations/_form.html.erb`
- `app/views/narrations/_narration.html.erb`
- `config/routes.rb`
- `test/controllers/narrations_controller_test.rb`

**Acceptance Criteria:**
- Routes nested under students
- Index shows student's narrations with date/subject filters
- New/Edit forms with subject selector and text input
- Turbo Stream responses for create/update/destroy
- Tests for CRUD actions

### Task 3: Voice Recording Input

Add voice narration support using native file input.

**Files:**
- `app/views/narrations/_form.html.erb` (update)
- `app/views/narrations/_narration.html.erb` (add audio player)
- `app/javascript/controllers/narration_type_controller.js`

**Acceptance Criteria:**
- File input with `accept="audio/*" capture="microphone"` triggers native recorder
- Narration type selector shows/hides appropriate input
- Voice narrations display with HTML5 audio player
- Active Storage handles audio file upload
- Tests for voice narration flow

### Task 4: Photo Upload Input

Add photo narration support using native file input.

**Files:**
- `app/views/narrations/_form.html.erb` (update)
- `app/views/narrations/_narration.html.erb` (add image display)

**Acceptance Criteria:**
- File input with `accept="image/*" capture="environment"` triggers camera/gallery
- Photo narrations display as responsive images
- Active Storage handles image upload
- Tests for photo narration flow

### Task 5: Subject narration_required Flag

Add flag to subjects and update form.

**Files:**
- `db/migrate/xxx_add_narration_required_to_subjects.rb`
- `app/models/subject.rb` (add has_narration_for? method)
- `app/views/subjects/_form.html.erb` (add checkbox)
- `app/controllers/subjects_controller.rb` (permit param)
- `test/models/subject_test.rb`

**Acceptance Criteria:**
- Migration adds boolean narration_required (default: false)
- Subject form has checkbox for narration_required
- has_narration_for?(date) method works correctly
- Tests for flag and method

### Task 6: Soft Enforcement Modal

Show reminder when completing subject without narration.

**Files:**
- `app/views/completions/_narration_reminder.html.erb`
- `app/views/completions/toggle.turbo_stream.erb` (update)
- `app/controllers/completions_controller.rb` (update)
- `app/javascript/controllers/modal_controller.js`

**Acceptance Criteria:**
- When completing subject with narration_required and no narration exists, show modal
- Modal offers "Add Narration" (links to new narration) or "Skip for Now"
- Modal closes on skip, escape key, or backdrop click
- Tests for soft enforcement flow

### Task 7: Narration List View

Filterable list of narrations.

**Files:**
- `app/views/narrations/index.html.erb`
- `app/views/narrations/_filters.html.erb`

**Acceptance Criteria:**
- Index shows all narrations for student, newest first
- Filter by date (date picker)
- Filter by subject (dropdown)
- Responsive grid/list layout
- Tests for filtering

### Task 8: Quick Add from Subject Card

Add narration link in weekly grid for subjects with narration_required.

**Files:**
- `app/views/today/_subject_row.html.erb` (or equivalent)
- Add navigation to students index

**Acceptance Criteria:**
- Subjects with narration_required show "+ Add narration" link
- Link pre-fills subject and current date
- Opens narration form (modal or page)
- Tests for quick add flow

### Task 9: Per-day Narration Indicators in Weekly Grid

Show narration status for each day in the weekly grid, not just today.

**Files:**
- `app/views/today/_weekly_grid.html.erb`
- `app/views/today/_completion_circle.html.erb`
- `app/controllers/today_controller.rb` (preload narration dates)

**Acceptance Criteria:**
- Each day cell shows narration indicator if narration exists for that subject/date
- Indicator is visually distinct but not overwhelming (e.g., small badge or dot)
- Clicking indicator navigates to the narration for that day
- Tests for per-day indicator display

---

## Issue Hierarchy

```
hs-narrate (EPIC)
├── hs-narrate.1: Narration model & migration ✅
├── hs-narrate.2: Text narration CRUD ✅
├── hs-narrate.3: Voice recording input ✅
├── hs-narrate.4: Photo upload input ✅
├── hs-narrate.5: Subject narration_required flag ✅
├── hs-narrate.6: Soft enforcement modal ✅
├── hs-narrate.7: Narration list view ✅
├── hs-narrate.8: Quick add from subject card ✅
└── hs-narrate.9: Per-day narration indicators in weekly grid
```

## Dependencies

```
hs-narrate.1 ─┬─► hs-narrate.2 ─┬─► hs-narrate.3
              │                 ├─► hs-narrate.4
              │                 ├─► hs-narrate.7
              │                 ├─► hs-narrate.8 ─► hs-narrate.9
              │                 └─► hs-narrate.6 (also needs .5)
              │
              └─► hs-narrate.5 ─► hs-narrate.6
```

**Visual flow:**
1. Model (Task 1) unlocks Tasks 2 and 5
2. Text CRUD (Task 2) unlocks Tasks 3, 4, 6, 7, 8
3. narration_required flag (Task 5) unlocks Task 6 (with Task 2)
4. Task 6 requires both Task 2 (routes) and Task 5 (flag)
5. Task 9 enhances Task 8 with per-day indicators

---

## Future Enhancements (Not in MVP)

- **Web Audio API**: Record voice directly in browser with waveform visualization
- **Image compression**: Client-side resize before upload
- **Batch narrations**: Add multiple narrations in one session
- **Narration templates**: Pre-defined prompts per subject
- **Export/sharing**: PDF export of narrations for portfolio

---

*Plan refined: 2026-01-29*
