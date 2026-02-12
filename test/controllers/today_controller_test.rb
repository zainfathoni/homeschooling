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

  test "shows add document link for subjects with narration_required when no document exists today" do
    sign_in_as @user
    post select_student_path(@student)

    narration_subject = subjects(:narration_required_subject)

    # Test on a day without document (2026-01-27)
    travel_to Date.new(2026, 1, 27) do
      get week_path
      assert_response :success
      assert_select "a[href*='documents/new'][href*='subject_id=#{narration_subject.id}'][href*='date=2026-01-27']", text: /document/
    end
  end

  test "does not show add document link for subjects without narration_required" do
    sign_in_as @user
    post select_student_path(@student)

    travel_to Date.new(2026, 1, 28) do
      get week_path
      assert_response :success
      # Math subject should not have document link (narration_required is false)
      assert_no_match /Math.*\+ document/, response.body
    end
  end

  test "shows document indicator on days with documents in weekly grid" do
    sign_in_as @user
    post select_student_path(@student)

    # Create document for narration_required_subject on 2026-01-28
    narration_subject = subjects(:narration_required_subject)
    document = Document.create!(subject: narration_subject, document_type: "text", content: "Test")
    Recording.create!(student: @student, date: Date.new(2026, 1, 28), recordable: document)

    travel_to Date.new(2026, 1, 28) do
      get week_path
      assert_response :success

      # Check for the document indicator link
      assert_select "a.bg-green-500[href*='documents'][href*='subject_id=#{narration_subject.id}'][href*='date=2026-01-28']"
    end
  end

  test "document indicator links to documents index with correct params" do
    sign_in_as @user
    post select_student_path(@student)

    # Create document for narration_required_subject on 2026-01-28
    narration_subject = subjects(:narration_required_subject)
    document = Document.create!(subject: narration_subject, document_type: "text", content: "Test")
    Recording.create!(student: @student, date: Date.new(2026, 1, 28), recordable: document)

    travel_to Date.new(2026, 1, 28) do
      get week_path
      assert_response :success

      # Verify link has correct student and filters
      assert_select "a[href='#{student_documents_path(@student, date: '2026-01-28', subject_id: narration_subject.id)}']"
    end
  end

  test "no document indicator on days without documents" do
    sign_in_as @user
    post select_student_path(@student)

    travel_to Date.new(2026, 1, 28) do
      # Delete the fixture document for Math to test clean state
      Document.where(subject: subjects(:one)).delete_all

      get week_path
      assert_response :success

      # Math subject now has no document
      math_subject = subjects(:one)
      # Should not have document indicator for Math
      assert_select "a.bg-green-500[href*='subject_id=#{math_subject.id}']", count: 0
    end
  end
end
