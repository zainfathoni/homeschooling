require "test_helper"

class NotesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:parent)
    @student = students(:one)
  end

  test "shows unified notes timeline" do
    sign_in_as @user
    post select_student_path(@student)

    get notes_path

    assert_response :success
    assert_match "Notes", response.body
  end

  test "filters by narrations" do
    sign_in_as @user
    post select_student_path(@student)

    get notes_path(filter: "narrations")

    assert_response :success
  end

  test "filters by quick notes" do
    sign_in_as @user
    post select_student_path(@student)

    get notes_path(filter: "quick_notes")

    assert_response :success
  end

  test "redirects to students when no student selected" do
    @user.students.destroy_all
    sign_in_as @user

    get notes_path

    assert_redirected_to students_path
  end

  test "displays student name in header" do
    sign_in_as @user
    post select_student_path(@student)

    get notes_path

    assert_response :success
    assert_match @student.name, response.body
  end

  test "shows filter pills for all, narrations, and quick notes" do
    sign_in_as @user
    post select_student_path(@student)

    get notes_path

    assert_response :success
    assert_select "a", text: "All"
    assert_select "a", text: "Narrations"
    assert_select "a", text: "Quick Notes"
  end

  test "includes recordables via delegated type" do
    sign_in_as @user
    post select_student_path(@student)

    get notes_path

    assert_response :success
    assert_select "div.bg-white.rounded-xl", minimum: 2
  end

  test "renders recording partials correctly" do
    sign_in_as @user
    post select_student_path(@student)

    get notes_path

    assert_response :success
    assert_select "turbo-frame", minimum: 2
  end
end
