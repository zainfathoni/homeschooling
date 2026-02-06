require "test_helper"

class StudentsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:parent)
    @student = students(:one)
    @other_student = students(:two)
  end

  test "redirects when not logged in" do
    get students_path
    assert_redirected_to login_path
  end

  test "index shows current user's students" do
    sign_in_as @user
    get students_path
    assert_response :success
    assert_match @student.name, response.body
    assert_no_match @other_student.name, response.body
  end

  test "show displays student profile" do
    sign_in_as @user
    get student_path(@student)
    assert_response :success
    assert_match @student.name, response.body
    assert_select "h2", @student.name
  end

  test "show displays subjects for student" do
    sign_in_as @user
    get student_path(@student)
    assert_response :success
    assert_match "Subjects", response.body
  end

  test "show displays weekly progress with completion counts" do
    sign_in_as @user
    subject = subjects(:one)
    week_start = Date.current.beginning_of_week(:monday)
    Completion.create!(subject: subject, date: week_start, completed: true)

    get student_path(@student)
    assert_response :success
    assert_match "This Week", response.body
    assert_match(/\d+\/\d+ done/, response.body)
  end

  test "show lists student subjects by name" do
    sign_in_as @user
    get student_path(@student)
    assert_response :success
    assert_match subjects(:one).name, response.body
  end

  test "show redirects for other user's student" do
    sign_in_as @user
    get student_path(@other_student)
    assert_redirected_to students_path
  end

  test "new shows form" do
    sign_in_as @user
    get new_student_path
    assert_response :success
    assert_select "form"
  end

  test "create adds a new student" do
    sign_in_as @user
    assert_difference "Student.count", 1 do
      post students_path, params: { student: { teachable_attributes: { name: "New Student" }, year_level: 4 } }
    end
    assert_redirected_to students_path
    assert_equal "New Student", Student.last.name
  end

  test "create fails with invalid data" do
    sign_in_as @user
    assert_no_difference "Student.count" do
      post students_path, params: { student: { teachable_attributes: { name: "" } } }
    end
    assert_response :unprocessable_entity
  end

  test "edit shows form for own student" do
    sign_in_as @user
    get edit_student_path(@student)
    assert_response :success
    assert_select "form"
  end

  test "edit redirects for other user's student" do
    sign_in_as @user
    get edit_student_path(@other_student)
    assert_redirected_to students_path
  end

  test "update changes student" do
    sign_in_as @user
    patch student_path(@student), params: { student: { teachable_attributes: { id: @student.teachable.id, name: "Updated Name" } } }
    assert_redirected_to students_path
    assert_equal "Updated Name", @student.reload.name
  end

  test "destroy removes student" do
    sign_in_as @user
    assert_difference "Student.count", -1 do
      delete student_path(@student)
    end
    assert_redirected_to students_path
  end

  test "destroy clears session when deleting current student" do
    sign_in_as @user
    post select_student_path(@student)
    delete student_path(@student)
    assert_nil session[:student_id]
  end

  test "select switches current student in session" do
    sign_in_as @user
    post select_student_path(@student)
    assert_redirected_to today_path
  end

  test "select redirects back to referer" do
    sign_in_as @user
    post select_student_path(@student), headers: { "HTTP_REFERER" => report_path }
    assert_redirected_to report_path
  end

  test "select rejects other user's student" do
    sign_in_as @user
    post select_student_path(@other_student)
    assert_redirected_to students_path
  end
end
