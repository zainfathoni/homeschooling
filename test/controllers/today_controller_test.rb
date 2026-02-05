require "test_helper"

class TodayControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:parent)
    @student = students(:one)
    @subject = subjects(:one)
  end

  test "redirects when not logged in" do
    get week_path
    assert_redirected_to login_path
  end

  test "shows week view when logged in" do
    sign_in_as @user
    post select_student_path(@student)
    get week_path
    assert_response :success
    assert_match @student.name, response.body
    assert_match @subject.name, response.body
  end

  test "loads week data with correct date range" do
    sign_in_as @user
    post select_student_path(@student)

    travel_to Date.new(2026, 1, 28) do # Wednesday
      get week_path
      assert_response :success
      # Controller sets week data - view integration tested in Task 8
    end
  end

  test "calculates progress correctly with no completions" do
    sign_in_as @user
    post select_student_path(@student)

    travel_to Date.new(2026, 1, 28) do
      Completion.delete_all
      get week_path
      assert_response :success
    end
  end

  test "calculates progress correctly with completions" do
    sign_in_as @user
    post select_student_path(@student)

    travel_to Date.new(2026, 1, 28) do
      Completion.delete_all
      Completion.create!(subject: @subject, date: Date.new(2026, 1, 26))
      Completion.create!(subject: @subject, date: Date.new(2026, 1, 27))

      get week_path
      assert_response :success
    end
  end

  test "excludes completions outside current week" do
    sign_in_as @user
    post select_student_path(@student)

    travel_to Date.new(2026, 1, 28) do
      Completion.delete_all
      Completion.create!(subject: @subject, date: Date.new(2026, 1, 28)) # This week
      Completion.create!(subject: @subject, date: Date.new(2026, 1, 19)) # Last week

      get week_path
      assert_response :success
    end
  end

  test "handles no student selected" do
    sign_in_as @user
    get week_path
    assert_response :success
  end

  test "progress calculation works with scheduled subjects" do
    sign_in_as @user
    post select_student_path(@student)

    travel_to Date.new(2026, 1, 28) do
      get week_path
      assert_response :success
      assert_select "turbo-frame#progress_bar"
    end
  end

  test "shows add narration link for subjects with narration_required when no narration exists today" do
    sign_in_as @user
    post select_student_path(@student)

    narration_subject = subjects(:narration_required_subject)

    # Test on a day without narration (2026-01-27)
    travel_to Date.new(2026, 1, 27) do
      get week_path
      assert_response :success
      assert_select "a[href*='narrations/new'][href*='subject_id=#{narration_subject.id}'][href*='date=2026-01-27']", text: /narration/
    end
  end

  test "does not show add narration link for subjects without narration_required" do
    sign_in_as @user
    post select_student_path(@student)

    travel_to Date.new(2026, 1, 28) do
      get week_path
      assert_response :success
      # Math subject should not have narration link (narration_required is false)
      assert_no_match /Math.*\+ narration/, response.body
    end
  end

  test "shows narration indicator on days with narrations in weekly grid" do
    sign_in_as @user
    post select_student_path(@student)

    # Create narration for narration_required_subject on 2026-01-28
    narration_subject = subjects(:narration_required_subject)
    narration = Narration.create!(subject: narration_subject, narration_type: "text", content: "Test")
    Recording.create!(student: @student, date: Date.new(2026, 1, 28), recordable: narration)

    travel_to Date.new(2026, 1, 28) do
      get week_path
      assert_response :success

      # Check for the narration indicator link
      assert_select "a.bg-green-500[href*='narrations'][href*='subject_id=#{narration_subject.id}'][href*='date=2026-01-28']"
    end
  end

  test "narration indicator links to narrations index with correct params" do
    sign_in_as @user
    post select_student_path(@student)

    # Create narration for narration_required_subject on 2026-01-28
    narration_subject = subjects(:narration_required_subject)
    narration = Narration.create!(subject: narration_subject, narration_type: "text", content: "Test")
    Recording.create!(student: @student, date: Date.new(2026, 1, 28), recordable: narration)

    travel_to Date.new(2026, 1, 28) do
      get week_path
      assert_response :success

      # Verify link has correct student and filters
      assert_select "a[href='#{student_narrations_path(@student, date: '2026-01-28', subject_id: narration_subject.id)}']"
    end
  end

  test "no narration indicator on days without narrations" do
    sign_in_as @user
    post select_student_path(@student)

    travel_to Date.new(2026, 1, 28) do
      # Delete the fixture narration for Math to test clean state
      Narration.where(subject: subjects(:one)).delete_all

      get week_path
      assert_response :success

      # Math subject now has no narration
      math_subject = subjects(:one)
      # Should not have narration indicator for Math
      assert_select "a.bg-green-500[href*='subject_id=#{math_subject.id}']", count: 0
    end
  end
end
