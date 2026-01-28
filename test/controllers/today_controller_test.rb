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
    assert_select "h1", "Today"
    assert_match @student.name, response.body
    assert_match @subject.name, response.body
  end
end
