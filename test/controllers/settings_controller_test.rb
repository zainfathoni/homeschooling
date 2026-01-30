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
    assert_select "p", "Settings coming soon"
  end
end
