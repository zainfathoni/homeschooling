require "test_helper"

class SessionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:parent)
  end

  test "should get login page" do
    get login_path
    assert_response :success
    assert_select "h1", "Sign in"
  end

  test "should sign in with valid credentials" do
    post login_path, params: { email: @user.email, password: "password123" }
    assert_redirected_to root_path
    follow_redirect!
    assert_select "h1", /Welcome/
  end

  test "should reject invalid password" do
    post login_path, params: { email: @user.email, password: "wrong" }
    assert_response :unprocessable_entity
    assert_select ".bg-red-100", /Invalid email or password/
  end

  test "should sign out" do
    post login_path, params: { email: @user.email, password: "password123" }
    delete logout_path
    assert_redirected_to login_path
  end

  test "session persists across requests" do
    post login_path, params: { email: @user.email, password: "password123" }
    get root_path
    assert_response :success
    assert_select "h1", /Welcome, #{@user.name}/
  end
end
