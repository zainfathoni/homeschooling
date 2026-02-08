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
    get report_path
    assert_response :success
    assert_match(/\d+.*\/.*\d+/, @response.body)
  end

  test "should show daily breakdown" do
    sign_in_as(@user)
    get report_path
    assert_response :success
    assert_select "h2", "Daily Breakdown"
  end

  test "should show subjects section" do
    sign_in_as(@user)
    get report_path
    assert_response :success
    assert_select "h2", "Subjects"
  end

  test "should show notes and narrations section" do
    sign_in_as(@user)
    get report_path
    assert_response :success
    assert_select "h2", "Notes & Narrations"
  end

  test "should navigate to previous week" do
    sign_in_as(@user)
    prev_week = Date.current.beginning_of_week - 7.days
    get report_path(week: prev_week.to_s)
    assert_response :success
    assert_match prev_week.strftime("%b %d"), @response.body
  end

  test "should navigate to specific week" do
    sign_in_as(@user)
    target = Date.new(2026, 1, 26)
    get report_path(week: target.to_s)
    assert_response :success
    assert_match "Jan 26", @response.body
  end

  test "should disable next week link when on current week" do
    sign_in_as(@user)
    get report_path
    assert_response :success
    assert_select "span", text: /Next →/
  end

  test "should show per-subject progress bars" do
    sign_in_as(@user)
    post select_student_path(@student)
    get report_path
    assert_response :success
    assert_match @subject.name, @response.body
  end

  test "should show week navigation" do
    sign_in_as(@user)
    get report_path
    assert_response :success
    assert_match "Prev", @response.body
  end

  test "should show progress percentage" do
    sign_in_as(@user)
    get report_path
    assert_response :success
    assert_match(/\d+% complete/, @response.body)
  end

  test "should handle missing student gracefully" do
    other_user = users(:other)
    sign_in_as(other_user)
    get report_path
    assert_response :success
  end
end
