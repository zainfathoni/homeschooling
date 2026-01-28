require "test_helper"

class HomeControllerTest < ActionDispatch::IntegrationTest
  test "redirects to login when not authenticated" do
    get root_path
    assert_redirected_to login_path
  end

  test "shows home page when authenticated" do
    user = users(:parent)
    post login_path, params: { email: user.email, password: "password123" }
    get root_path
    assert_response :success
    assert_select "h1", /Welcome, #{user.name}/
  end
end
