require "test_helper"

class StudentSelectionTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:parent)
    @student_one = students(:one)
  end

  test "current_student defaults to first student when not set in session" do
    sign_in_as @user
    get week_path
    assert_response :success
    assert_match @student_one.name, response.body
  end

  test "current_student returns nil when user has no students" do
    @user.students.destroy_all
    sign_in_as @user
    get week_path
    assert_response :success
  end

  test "current_student is available as a helper method" do
    sign_in_as @user
    get week_path
    assert_response :success
  end
end
