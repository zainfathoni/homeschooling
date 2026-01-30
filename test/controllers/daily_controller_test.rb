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
    get today_path
    assert_response :success
    assert_match @subject.name, response.body
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

  test "displays all subjects for the student" do
    sign_in_as @user
    post select_student_path(@student)

    get today_path
    assert_response :success

    @student.subjects.each do |subject|
      assert_match subject.name, response.body
    end
  end
end
