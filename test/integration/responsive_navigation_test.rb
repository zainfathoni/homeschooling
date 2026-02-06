require "test_helper"

class ResponsiveNavigationTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:parent)
    @student = students(:one)
    @subject = subjects(:one)
    sign_in_as @user
    post select_student_path(@student)
  end

  # Bottom Navigation Tests

  test "bottom nav renders with all four links when authenticated with student" do
    get week_path
    assert_response :success
    assert_select "nav.fixed.bottom-0" do
      assert_select "a[href='#{today_path}']", text: /Today/
      assert_select "a[href='#{week_path}']", text: /Week/
      assert_select "a[href='#{notes_path}']", text: /Notes/
      assert_select "a[href='#{settings_path}']", text: /Settings/
    end
  end

  test "bottom nav has md:hidden class for tablet responsiveness" do
    get week_path
    assert_response :success
    assert_select "nav.md\\:hidden"
  end

  test "bottom nav links have 44px minimum touch targets" do
    get week_path
    assert_response :success
    assert_select "nav.fixed.bottom-0 a.min-h-\\[44px\\]", minimum: 4
  end

  test "bottom nav not rendered when not authenticated" do
    delete logout_path
    get login_path
    assert_response :success
    assert_select "nav.fixed.bottom-0", count: 0
  end

  # Daily Focus View Tests

  test "daily focus view shows date header" do
    travel_to Date.new(2026, 1, 28) do
      get today_path
      assert_response :success
      assert_match "Wednesday, Jan 28", response.body
    end
  end

  test "daily focus view shows progress ring" do
    get today_path
    assert_response :success
    assert_select "turbo-frame#progress_ring"
    assert_select "svg circle", minimum: 2  # Background and progress circles
  end

  test "daily focus view shows task cards" do
    travel_to Date.new(2026, 1, 28) do
      get today_path
      assert_response :success
      # Check for task cards with 44px touch targets
      assert_select "button.w-11.h-11", minimum: 1
    end
  end

  test "daily focus responds to turbo frame requests" do
    get daily_path(date: "2026-01-28"),
        headers: { "Turbo-Frame" => "daily_focus" }
    assert_response :success
    assert_select "turbo-frame#daily_focus"
  end

  # Duet Layout Tests

  test "week view includes duet layout structure" do
    get week_path
    assert_response :success
    # Single responsive grid layout (mobile: stacked, tablet: side-by-side)
    assert_select "div.md\\:grid.md\\:grid-cols-5"
    # Weekly grid column (full width mobile, 60% tablet)
    assert_select "div.md\\:col-span-3"
    # Daily focus column (hidden mobile, 40% tablet)
    assert_select "div.hidden.md\\:block.md\\:col-span-2"
  end

  test "week view shows daily focus in tablet split panel" do
    travel_to Date.new(2026, 1, 28) do
      get week_path
      assert_response :success
      # The turbo frame should be in the right panel (hidden on mobile, visible on tablet)
      assert_select "div.md\\:col-span-2 turbo-frame#daily_focus"
    end
  end

  # Clickable Day Navigation Tests

  test "weekly grid day headers are clickable links" do
    travel_to Date.new(2026, 1, 28) do
      get week_path
      assert_response :success
      # Day headers should link to daily_path
      assert_select "a[href*='/daily/']", minimum: 5
    end
  end

  test "weekly grid day headers have turbo frame data attribute" do
    travel_to Date.new(2026, 1, 28) do
      get week_path
      assert_response :success
      assert_select "a[data-turbo-frame='daily_focus']", minimum: 5
    end
  end

  test "weekly grid day headers are 44px touch targets" do
    travel_to Date.new(2026, 1, 28) do
      get week_path
      assert_response :success
      assert_select "a.w-11.h-11[href*='/daily/']", minimum: 5
    end
  end

  test "clicking day header updates daily focus via turbo frame" do
    travel_to Date.new(2026, 1, 28) do
      # First load week view
      get week_path
      assert_response :success

      # Then request specific day via turbo frame
      get daily_path(date: "2026-01-27"),
          headers: { "Turbo-Frame" => "daily_focus" }
      assert_response :success
      assert_match "Tuesday, Jan 27", response.body
    end
  end

  # Completion Toggle Updates All Components Tests

  test "completion toggle returns turbo stream with all component updates" do
    travel_to Date.new(2026, 1, 28) do
      @subject.completions.where(date: Date.new(2026, 1, 28)).destroy_all

      post toggle_completion_path(subject_id: @subject.id, date: "2026-01-28"),
           headers: { "Accept" => "text/vnd.turbo-stream.html" }
      assert_response :success

      # Should update weekly grid circle
      assert_match "circle_2026-01-28", response.body
      # Should update progress bar
      assert_match "progress_bar", response.body
      # Should update daily focus task card
      assert_match "task_2026-01-28", response.body
      # Should update progress ring
      assert_match "progress_ring", response.body
    end
  end

  test "completing task shows coral border in daily focus" do
    travel_to Date.new(2026, 1, 28) do
      @subject.completions.where(date: Date.new(2026, 1, 28)).destroy_all

      # Complete the task
      post toggle_completion_path(subject_id: @subject.id, date: "2026-01-28")

      # Check daily focus view
      get today_path
      assert_response :success
      assert_select ".border-coral", minimum: 1
    end
  end

  test "progress ring updates after completion toggle" do
    travel_to Date.new(2026, 1, 28) do
      @subject.completions.where(date: Date.new(2026, 1, 28)).destroy_all

      # Get initial state
      get today_path
      initial_body = response.body

      # Complete the task
      post toggle_completion_path(subject_id: @subject.id, date: "2026-01-28")

      # Get updated state
      get today_path
      updated_body = response.body

      # Progress should have changed (count increased)
      assert initial_body != updated_body
    end
  end

  # Navigation Flow Tests

  test "today link navigates to daily focus" do
    get today_path
    assert_response :success
    assert_select "turbo-frame#daily_focus"
  end

  test "week link navigates to weekly grid with duet layout" do
    get week_path
    assert_response :success
    assert_match "Weekly Progress", response.body
  end

  test "notes link navigates to narrations" do
    get notes_path
    assert_response :redirect
    follow_redirect!
    assert_response :success
  end

  test "settings link shows settings page" do
    get settings_path
    assert_response :success
    assert_match /settings/i, response.body
  end

  # Quick Note FAB Tests

  test "quick note FAB renders on mobile when authenticated with student" do
    get today_path
    assert_response :success
    # FAB container with Stimulus controller
    assert_select "div[data-controller='quick-note-fab']" do
      # FAB button with coral background
      assert_select "button[data-action='click->quick-note-fab#open']"
      # Modal container (hidden by default)
      assert_select "div[data-quick-note-fab-target='modal'].hidden"
    end
  end

  test "quick note FAB has md:hidden class for mobile-only display" do
    get today_path
    assert_response :success
    assert_select "div[data-controller='quick-note-fab'].md\\:hidden"
  end

  test "quick note FAB modal contains form for creating notes" do
    get today_path
    assert_response :success
    assert_select "div[data-quick-note-fab-target='modal']" do
      assert_select "form[action='#{student_quick_notes_path(@student)}']"
      assert_select "textarea[name='quick_note[content]']"
      assert_select "input[type='submit']"
    end
  end

  test "quick note FAB not rendered when not authenticated" do
    delete logout_path
    get login_path
    assert_response :success
    assert_select "div[data-controller='quick-note-fab']", count: 0
  end

  # Date Boundary Tests

  test "daily focus for specific date shows correct subjects" do
    scheduled_subject = subjects(:scheduled_coding)
    monday = Date.new(2026, 1, 26)  # Monday - active for coding
    friday = Date.new(2026, 1, 30)  # Friday - not active for coding

    get daily_path(date: monday.to_s)
    assert_response :success
    assert_match scheduled_subject.name, response.body
    assert_no_match(/Not today/, response.body)

    # On off-days, scheduled subjects appear grayed out with "Not today" label
    get daily_path(date: friday.to_s)
    assert_response :success
    assert_match scheduled_subject.name, response.body
    assert_match(/Not today/, response.body)
    assert_select ".opacity-60", minimum: 1
  end
end
