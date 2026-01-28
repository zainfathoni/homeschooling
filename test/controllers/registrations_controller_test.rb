require "test_helper"

class RegistrationsControllerTest < ActionDispatch::IntegrationTest
  test "should get signup page" do
    get signup_path
    assert_response :success
    assert_select "h1", "Create account"
  end

  test "should create user with valid params" do
    assert_difference("User.count") do
      post signup_path, params: { user: {
        email: "new@example.com",
        name: "New User",
        password: "password123",
        password_confirmation: "password123"
      } }
    end
    assert_redirected_to root_path
  end

  test "should show errors for invalid params" do
    post signup_path, params: { user: {
      email: "",
      name: "",
      password: "short",
      password_confirmation: "different"
    } }
    assert_response :unprocessable_entity
    assert_select ".bg-red-100"
  end
end
