require "test_helper"

class GroupSubjectsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:parent)
    @student_group = student_groups(:family_group)
    @subject = subjects(:family_science)
  end

  test "redirects when not logged in" do
    get student_group_subjects_path(@student_group)
    assert_redirected_to login_path
  end

  test "shows subjects index" do
    sign_in_as @user
    get student_group_subjects_path(@student_group)
    assert_response :success
    assert_match @subject.name, response.body
  end

  test "shows new subject form" do
    sign_in_as @user
    get new_student_group_subject_path(@student_group)
    assert_response :success
  end

  test "creates fixed subject" do
    sign_in_as @user

    assert_difference "Subject.count", 1 do
      post student_group_subjects_path(@student_group), params: {
        subject: { name: "Group Art", subject_type: "fixed" }
      }
    end

    new_subject = Subject.last
    assert_equal "Group Art", new_subject.name
    assert new_subject.fixed?
    assert_equal @student_group.teachable, new_subject.teachable
    assert_redirected_to student_group_path(@student_group)
  end

  test "renders new on invalid create" do
    sign_in_as @user

    assert_no_difference "Subject.count" do
      post student_group_subjects_path(@student_group), params: {
        subject: { name: "", subject_type: "fixed" }
      }
    end

    assert_response :unprocessable_entity
  end

  test "shows edit subject form" do
    sign_in_as @user
    get edit_student_group_subject_path(@student_group, @subject)
    assert_response :success
    assert_match @subject.name, response.body
  end

  test "updates subject" do
    sign_in_as @user
    patch student_group_subject_path(@student_group, @subject), params: {
      subject: { name: "Updated Science" }
    }
    assert_redirected_to student_group_path(@student_group)
    assert_equal "Updated Science", @subject.reload.name
  end

  test "renders edit on invalid update" do
    sign_in_as @user
    patch student_group_subject_path(@student_group, @subject), params: {
      subject: { name: "" }
    }
    assert_response :unprocessable_entity
  end

  test "deletes subject" do
    sign_in_as @user

    assert_difference "Subject.count", -1 do
      delete student_group_subject_path(@student_group, @subject)
    end

    assert_redirected_to student_group_path(@student_group)
  end

  test "cannot access another user's group subjects" do
    other_user = User.create!(email: "other_group_#{SecureRandom.hex(4)}@example.com", name: "Other", password: "password123")
    sign_in_as other_user

    get student_group_subjects_path(@student_group)
    assert_redirected_to student_groups_path
  end

  test "cannot access subject from another group" do
    sign_in_as @user
    other_group = student_groups(:joint_group)

    get edit_student_group_subject_path(other_group, @subject)
    assert_redirected_to student_group_path(other_group)
  end
end
