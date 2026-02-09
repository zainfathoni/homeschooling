require "test_helper"

class SetupControllerTest < ActionDispatch::IntegrationTest
  setup do
    @new_user = User.create!(email: "newuser@example.com", password: "password123", name: "New User")
    @existing_user = users(:parent)
  end

  test "redirects to login when not authenticated" do
    get setup_path
    assert_redirected_to login_path
  end

  test "shows welcome page for new user without students" do
    post login_path, params: { email: @new_user.email, password: "password123" }
    get setup_path
    assert_response :success
    assert_select "h1", /Welcome to Homeschooling/
  end

  test "redirects existing user with students to week" do
    post login_path, params: { email: @existing_user.email, password: "password123" }
    get setup_path
    assert_redirected_to week_path
  end

  test "shows student creation form" do
    post login_path, params: { email: @new_user.email, password: "password123" }
    get setup_student_path
    assert_response :success
    assert_select "h1", /Add Your First Student/
  end

  test "creates student and redirects to complete" do
    post login_path, params: { email: @new_user.email, password: "password123" }

    assert_difference("Student.count", 1) do
      post setup_student_path, params: {
        student: {
          year_level: 5,
          teachable_attributes: { name: "Test Student" }
        }
      }
    end

    assert_redirected_to setup_complete_path
    follow_redirect!
    assert_response :success
  end

  test "shows complete page after student creation" do
    post login_path, params: { email: @new_user.email, password: "password123" }
    post setup_student_path, params: {
      student: {
        year_level: 5,
        teachable_attributes: { name: "Test Student" }
      }
    }

    get setup_complete_path
    assert_response :success
    assert_select "h1", /You're All Set/
  end

  test "complete page redirects when user has no students" do
    post login_path, params: { email: @new_user.email, password: "password123" }
    # Don't create student, go directly to complete
    get setup_complete_path
    # Should redirect to setup since user hasn't completed the flow
    assert_redirected_to setup_path
  end

  test "setup flow sets session student_id after creation" do
    post login_path, params: { email: @new_user.email, password: "password123" }
    post setup_student_path, params: {
      student: {
        year_level: 5,
        teachable_attributes: { name: "Test Student" }
      }
    }

    # After creating, user should have the student selected
    follow_redirect!
    # The complete page should render with current_student set
    assert_response :success
    student = @new_user.students.first
    assert_equal student.id, session[:student_id]
  end

  test "shows validation errors on invalid student" do
    post login_path, params: { email: @new_user.email, password: "password123" }

    assert_no_difference("Student.count") do
      post setup_student_path, params: {
        student: {
          year_level: 5,
          teachable_attributes: { name: "" }  # Empty name should fail
        }
      }
    end

    assert_response :unprocessable_entity
  end
end
