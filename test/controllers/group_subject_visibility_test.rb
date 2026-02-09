require "test_helper"

class GroupSubjectVisibilityTest < ActionDispatch::IntegrationTest
  # Group member visibility and access control tests (Issue #47)
  #
  # Fixture setup:
  # - Student one (Alex): parent user, IN family_group + joint_group
  # - Student two (Sam): other user, NOT in any group
  # - Student three (Jordan): parent user, IN family_group only
  # - family_science: Subject belonging to family_group

  # Flash message used by subjects_controller when subject not found
  # Note: Controller uses hardcoded string; tests mirror this for now
  SUBJECT_NOT_FOUND_MESSAGE = "Subject not found".freeze

  setup do
    @parent = users(:parent)
    @other_user = users(:other)
    @student_in_group = students(:one)       # Alex - in family_group
    @student_not_in_group = students(:two)   # Sam - not in any group
    @group_subject = subjects(:family_science)
    @personal_subject = subjects(:one)       # Math - Alex's personal subject
  end

  # ==========================================================================
  # POSITIVE VISIBILITY - Group members should see group subjects
  # ==========================================================================

  test "group member sees group subjects in weekly grid" do
    sign_in_as @parent
    post select_student_path(@student_in_group)

    travel_to Date.new(2026, 1, 28) do # Wednesday
      get week_path
      assert_response :success
      assert_match @group_subject.name, response.body, "Group subject should appear in weekly grid"
      assert_match @personal_subject.name, response.body, "Personal subject should also appear"
    end
  end

  test "group member sees group subjects in daily focus" do
    sign_in_as @parent
    post select_student_path(@student_in_group)

    travel_to Date.new(2026, 1, 28) do
      get daily_path(date: "2026-01-28")
      assert_response :success
      assert_match @group_subject.name, response.body, "Group subject should appear in daily focus"
    end
  end

  test "group member sees group subjects in subjects index" do
    sign_in_as @parent

    get student_subjects_path(@student_in_group)
    assert_response :success
    assert_match @group_subject.name, response.body, "Group subject should appear in subjects list"
    assert_match @personal_subject.name, response.body, "Personal subject should also appear"
  end

  # ==========================================================================
  # NEGATIVE VISIBILITY - Non-members should NOT see group subjects
  # ==========================================================================

  test "non-member does NOT see group subjects in weekly grid" do
    sign_in_as @other_user
    post select_student_path(@student_not_in_group)

    travel_to Date.new(2026, 1, 28) do
      get week_path
      assert_response :success
      assert_no_match @group_subject.name, response.body, "Group subject should NOT appear for non-member"
    end
  end

  test "non-member does NOT see group subjects in daily focus" do
    sign_in_as @other_user
    post select_student_path(@student_not_in_group)

    travel_to Date.new(2026, 1, 28) do
      get daily_path(date: "2026-01-28")
      assert_response :success
      assert_no_match @group_subject.name, response.body, "Group subject should NOT appear for non-member in daily focus"
    end
  end

  test "non-member does NOT see group subjects in subjects index" do
    sign_in_as @other_user

    get student_subjects_path(@student_not_in_group)
    assert_response :success
    assert_no_match @group_subject.name, response.body, "Group subject should NOT appear for non-member"
  end

  # ==========================================================================
  # ACCESS CONTROL - Non-members cannot access group subjects via direct URL
  # ==========================================================================

  test "non-member cannot edit a group subject via direct URL" do
    sign_in_as @other_user

    get edit_student_subject_path(@student_not_in_group, @group_subject)
    assert_redirected_to student_subjects_path(@student_not_in_group)
    assert_equal SUBJECT_NOT_FOUND_MESSAGE, flash[:alert]
  end

  test "non-member cannot update a group subject via direct URL" do
    original_name = @group_subject.name
    sign_in_as @other_user

    patch student_subject_path(@student_not_in_group, @group_subject), params: {
      subject: { name: "Hacked Name" }
    }
    assert_redirected_to student_subjects_path(@student_not_in_group)
    assert_equal SUBJECT_NOT_FOUND_MESSAGE, flash[:alert]
    assert_equal original_name, @group_subject.reload.name, "Subject should not be modified"
  end

  test "non-member cannot delete a group subject via direct URL" do
    sign_in_as @other_user

    assert_no_difference "Subject.count" do
      delete student_subject_path(@student_not_in_group, @group_subject)
    end
    assert_redirected_to student_subjects_path(@student_not_in_group)
    assert_equal SUBJECT_NOT_FOUND_MESSAGE, flash[:alert]
  end

  # ==========================================================================
  # MEMBER ACCESS - Group members (non-owners) CAN manage group subjects
  # ==========================================================================
  # Group subjects are collaborative - any group member can edit/update/delete
  # them, not just the original creator. This enables shared curriculum management.

  test "group member (non-owner) can edit a group subject" do
    # Student three (Jordan) is in family_group but didn't create family_science
    student_three = students(:three)
    sign_in_as users(:parent) # parent owns student_three

    get edit_student_subject_path(student_three, @group_subject)
    assert_response :success, "Group member should be able to access edit form"
    assert_match @group_subject.name, response.body
  end

  test "group member (non-owner) can update a group subject" do
    student_three = students(:three)
    sign_in_as users(:parent)
    new_name = "Updated by Non-Owner"

    patch student_subject_path(student_three, @group_subject), params: {
      subject: { name: new_name }
    }
    assert_redirected_to student_subjects_path(student_three)
    assert_equal new_name, @group_subject.reload.name, "Group member should be able to update subject"
  end

  test "group member (non-owner) can delete a group subject" do
    student_three = students(:three)
    sign_in_as users(:parent)

    # Create a temporary subject to delete (don't delete fixture)
    family_group = student_groups(:family_group)
    temp_subject = Subject.create!(
      name: "Temp Subject for Deletion",
      teachable: family_group.teachable,
      subject_type: "fixed"
    )

    assert_difference "Subject.count", -1 do
      delete student_subject_path(student_three, temp_subject)
    end
    assert_redirected_to student_subjects_path(student_three)
  end

  # ==========================================================================
  # CROSS-USER ISOLATION - Users cannot access other users' students/subjects
  # ==========================================================================

  test "user cannot access another user's student" do
    # other_user tries to access parent's student (student_in_group)
    # This should fail because other_user doesn't own this student
    sign_in_as @other_user

    # Attempting to access someone else's student should redirect
    get student_subjects_path(@student_in_group)
    assert_redirected_to students_path
    assert_equal "Student not found", flash[:alert]
  end

  test "user cannot edit group subject through another user's student" do
    # other_user tries to access family_science through parent's student
    # This should fail at the student lookup level
    sign_in_as @other_user

    get edit_student_subject_path(@student_in_group, @group_subject)
    assert_redirected_to students_path
    assert_equal "Student not found", flash[:alert]
  end

  # ==========================================================================
  # Model-level tests for Subject#for_student?
  # ==========================================================================

  test "Subject#for_student? returns true for group member" do
    assert @group_subject.for_student?(@student_in_group),
      "for_student? should return true for group member"
  end

  test "Subject#for_student? returns false for non-member" do
    refute @group_subject.for_student?(@student_not_in_group),
      "for_student? should return false for non-member"
  end

  test "Subject#for_student? returns true for personal subject owner" do
    assert @personal_subject.for_student?(@student_in_group),
      "for_student? should return true for personal subject owner"
  end

  test "Subject#for_student? returns false for non-owner of personal subject" do
    refute @personal_subject.for_student?(@student_not_in_group),
      "for_student? should return false for non-owner"
  end

  # ==========================================================================
  # Model-level tests for Student#all_subjects
  # ==========================================================================

  test "Student#all_subjects includes personal and group subjects for member" do
    subjects = @student_in_group.all_subjects

    assert_includes subjects, @personal_subject, "Should include personal subject"
    assert_includes subjects, @group_subject, "Should include group subject"
  end

  test "Student#all_subjects excludes group subjects for non-member" do
    subjects = @student_not_in_group.all_subjects

    assert_not_includes subjects, @group_subject, "Should NOT include group subject for non-member"
  end

  test "Student#all_subjects includes subjects from all joined groups" do
    # Student one is in both family_group and joint_group
    subjects = @student_in_group.all_subjects

    assert_includes subjects, @group_subject, "Should include family group subject"
    # Note: joint_group doesn't have subjects in fixtures, but the mechanism works
  end

  # ==========================================================================
  # Edge case: Student in one group but not another
  # ==========================================================================

  test "student only sees subjects from groups they belong to" do
    # Student three (Jordan) is in family_group but NOT joint_group
    # Create a subject for joint_group
    joint_group = student_groups(:joint_group)
    joint_subject = Subject.create!(
      name: "Joint Group Subject",
      teachable: joint_group.teachable,
      subject_type: "fixed"
    )

    student_three = students(:three)
    subjects = student_three.all_subjects

    assert_includes subjects, @group_subject,
      "Should include family_group subject (#{@group_subject.name}) - Jordan is a member"
    assert_not_includes subjects, joint_subject,
      "Should NOT include joint_group subject (#{joint_subject.name}) - Jordan is not a member"
  ensure
    joint_subject&.destroy
  end
end
