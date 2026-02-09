require "test_helper"

class HomeControllerTest < ActionDispatch::IntegrationTest
  test "redirects to login when not authenticated" do
    get root_path
    assert_redirected_to login_path
  end

  test "redirects to week when user has students" do
    user = users(:parent)
    post login_path, params: { email: user.email, password: "password123" }
    get root_path
    assert_redirected_to week_path
  end

  test "redirects to setup when user has no students" do
    # Create a user with no students
    user = User.create!(email: "newuser@example.com", password: "password123", name: "New User")
    post login_path, params: { email: user.email, password: "password123" }
    get root_path
    assert_redirected_to setup_path
  end
end
