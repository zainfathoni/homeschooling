require "test_helper"

class DailyControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:parent)
    @student = students(:one)
    @subject = subjects(:one)
  end

  test "redirects when not logged in" do
    get today_path
    assert_redirected_to login_path
  end

  test "redirects to students page when no student selected" do
    @user.students.destroy_all
    sign_in_as @user
    get today_path
    assert_redirected_to students_path
  end

  test "shows daily focus view when logged in with student" do
    sign_in_as @user
    post select_student_path(@student)

    travel_to Date.new(2026, 1, 28) do  # Wednesday
      get today_path
      assert_response :success
      assert_match @subject.name, response.body
    end
  end

  test "shows correct date header" do
    sign_in_as @user
    post select_student_path(@student)

    travel_to Date.new(2026, 1, 28) do
      get today_path
      assert_response :success
      assert_match "Wednesday, Jan 28", response.body
    end
  end

  test "shows specific date with daily path" do
    sign_in_as @user
    post select_student_path(@student)

    get daily_path(date: "2026-01-27")
    assert_response :success
    assert_match "Tuesday, Jan 27", response.body
  end

  test "handles invalid date gracefully" do
    sign_in_as @user
    post select_student_path(@student)

    travel_to Date.new(2026, 1, 28) do
      get daily_path(date: "invalid-date")
      assert_response :success
      assert_match "Wednesday, Jan 28", response.body
    end
  end

  test "shows completed subjects with coral border" do
    sign_in_as @user
    post select_student_path(@student)

    travel_to Date.new(2026, 1, 28) do
      Completion.find_or_create_by!(subject: @subject, date: Date.new(2026, 1, 28))
      get today_path
      assert_response :success
      assert_select ".border-coral", minimum: 1
    end
  end

  test "shows uncompleted subjects with gray border" do
    sign_in_as @user
    post select_student_path(@student)

    travel_to Date.new(2026, 1, 28) do
      Completion.where(subject: @subject, date: Date.new(2026, 1, 28)).destroy_all
      get today_path
      assert_response :success
      assert_select ".border-gray-200", minimum: 1
    end
  end

  test "displays only active subjects for the day" do
    sign_in_as @user
    post select_student_path(@student)

    monday = Date.new(2026, 1, 26)
    travel_to monday do
      get today_path
      assert_response :success

      @student.subjects.each do |subject|
        if subject.active_on?(monday)
          assert_match subject.name, response.body, "Expected active subject #{subject.name} to be shown"
        end
      end
    end
  end

  # Turbo Frame Tests

  test "responds with turbo frame wrapper" do
    sign_in_as @user
    post select_student_path(@student)

    get today_path
    assert_response :success
    assert_select "turbo-frame#daily_focus"
  end

  test "turbo frame request returns only daily focus content" do
    sign_in_as @user
    post select_student_path(@student)

    get daily_path(date: "2026-01-28"),
        headers: { "Turbo-Frame" => "daily_focus" }
    assert_response :success
    assert_select "turbo-frame#daily_focus"
  end

  # Progress Ring Tests

  test "shows progress ring with task count" do
    sign_in_as @user
    post select_student_path(@student)

    travel_to Date.new(2026, 1, 28) do
      get today_path
      assert_response :success
      assert_select "turbo-frame#progress_ring"
      assert_match %r{\d+/\d+}, response.body  # X/Y format
    end
  end

  test "progress ring reflects completion state" do
    sign_in_as @user
    post select_student_path(@student)

    travel_to Date.new(2026, 1, 28) do
      Completion.where(subject: @subject, date: Date.new(2026, 1, 28)).destroy_all
      Completion.create!(subject: @subject, date: Date.new(2026, 1, 28))

      get today_path
      assert_response :success
      # Should show at least 1 completed
      assert_match %r{[1-9]\d*/\d+}, response.body
    end
  end

  # Task Card Tests

  test "task cards have toggle completion buttons" do
    sign_in_as @user
    post select_student_path(@student)

    travel_to Date.new(2026, 1, 28) do
      get today_path
      assert_response :success
      assert_select "button[class*='w-11'][class*='h-11']", minimum: 1
    end
  end

  test "task cards wrapped in turbo frames" do
    sign_in_as @user
    post select_student_path(@student)

    travel_to Date.new(2026, 1, 28) do
      get today_path
      assert_response :success
      # Task cards are wrapped in turbo-frame with id like "subject_123_task_2026-01-28"
      assert_select "turbo-frame[id*='task_']", minimum: 1
    end
  end

  test "shows narration indicator for subjects with narration" do
    sign_in_as @user
    post select_student_path(@student)

    narration_subject = subjects(:narration_required_subject)

    travel_to Date.new(2026, 1, 28) do
      get today_path
      assert_response :success
      # Narration exists for this date in fixtures
      assert_match(/narrated/, response.body)
    end
  end

  test "shows add narration link for subjects without narration" do
    sign_in_as @user
    post select_student_path(@student)

    narration_subject = subjects(:narration_required_subject)
    # Test on a day without narration
    monday = Date.new(2026, 1, 26)
    narration_subject.narrations.where(date: monday).destroy_all

    travel_to monday do
      get today_path
      assert_response :success
      assert_match(/add narration/, response.body)
    end
  end

  # Scheduled Subject Filtering

  test "shows scheduled subjects on off-days with not today label" do
    sign_in_as @user
    post select_student_path(@student)

    scheduled_subject = subjects(:scheduled_coding)
    friday = Date.new(2026, 1, 30)  # Friday - not in [0,1,2,3]

    travel_to friday do
      get today_path
      assert_response :success
      assert_match scheduled_subject.name, response.body
      assert_match(/Not today/, response.body)
      assert_match(/Not scheduled today/, response.body)
      assert_select ".opacity-50", minimum: 1
    end
  end

  test "includes scheduled subjects on active days" do
    sign_in_as @user
    post select_student_path(@student)

    scheduled_subject = subjects(:scheduled_coding)
    monday = Date.new(2026, 1, 26)  # Monday - day 0

    travel_to monday do
      get today_path
      assert_response :success
      assert_match scheduled_subject.name, response.body
    end
  end
end
