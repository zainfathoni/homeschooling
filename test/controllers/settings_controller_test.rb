require "test_helper"

class SettingsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:parent)
    @student = students(:one)
  end

  test "shows settings page" do
    sign_in_as @user
    post select_student_path(@student)

    get settings_path

    assert_response :success
    assert_select "h1", "Settings"
  end

  test "settings page has navigation links to groups and reports" do
    sign_in_as @user
    post select_student_path(@student)

    get settings_path

    assert_response :success
    assert_select "h2", "Navigation"
    assert_select "a[href='#{student_groups_path}']", text: /Groups/
    assert_select "a[href='#{report_path}']", text: /Reports/
  end
end
