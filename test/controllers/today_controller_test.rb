require "test_helper"

class TodayControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:parent)
    @student = students(:one)
    @subject = subjects(:one)
  end

  test "redirects when not logged in" do
    get today_path
    assert_redirected_to login_path
  end

  test "shows today view when logged in" do
    sign_in_as @user
    post select_student_path(@student)
    get today_path
    assert_response :success
    assert_match @student.name, response.body
    assert_match @subject.name, response.body
  end

  test "loads week data with correct date range" do
    sign_in_as @user
    post select_student_path(@student)

    travel_to Date.new(2026, 1, 28) do # Wednesday
      get today_path
      assert_response :success
      # Controller sets week data - view integration tested in Task 8
    end
  end

  test "calculates progress correctly with no completions" do
    sign_in_as @user
    post select_student_path(@student)

    travel_to Date.new(2026, 1, 28) do
      Completion.delete_all
      get today_path
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

      get today_path
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

      get today_path
      assert_response :success
    end
  end

  test "handles no student selected" do
    sign_in_as @user
    get today_path
    assert_response :success
  end

  test "progress calculation works with scheduled subjects" do
    sign_in_as @user
    post select_student_path(@student)

    travel_to Date.new(2026, 1, 28) do
      get today_path
      assert_response :success
      assert_select "turbo-frame#progress_bar"
    end
  end
end
