require "test_helper"

class NotesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:parent)
    @student = students(:one)
  end

  test "redirects to student narrations" do
    sign_in_as @user
    post select_student_path(@student)

    get notes_path

    assert_redirected_to student_narrations_path(@student)
  end

  test "redirects to students when no student selected" do
    @user.students.destroy_all
    sign_in_as @user

    get notes_path

    assert_redirected_to students_path
  end
end
