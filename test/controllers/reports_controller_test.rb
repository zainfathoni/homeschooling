require "test_helper"

class ReportsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:parent)
    @student = students(:one)
    @subject = subjects(:one)
  end

  test "should get index when logged in" do
    sign_in_as(@user)
    get report_path
    assert_response :success
    assert_select "h1", "Weekly Report"
  end

  test "should redirect to login when not authenticated" do
    get report_path
    assert_redirected_to login_path
  end

  test "should display completion count" do
    sign_in_as(@user)
    completion = completions(:one)
    completion.update!(completed: true)

    get report_path
    assert_response :success
    assert_match /\d+.*\/.*\d+/, @response.body
  end

  test "should show daily breakdown" do
    sign_in_as(@user)
    get report_path
    assert_response :success
    assert_select "h2", "Daily Breakdown"
  end
end
