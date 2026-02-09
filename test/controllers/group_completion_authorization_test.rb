require "test_helper"

class GroupCompletionAuthorizationTest < ActionDispatch::IntegrationTest
  # Group-subject completion authorization tests (Issue #37)
  #
  # Per ADR-004:
  # - Individual subjects: parent OR student can complete
  # - Group subjects: parent ONLY can complete

  setup do
    @parent = users(:parent)
    @student_user = users(:alex_student_user)
    @student_in_group = students(:one)  # Alex - in family_group
    @personal_subject = subjects(:one)  # Math - Alex's personal subject
    @group_subject = subjects(:family_science)
    @test_date = Date.new(2026, 1, 29)  # Thursday - avoids fixture conflicts
  end

  # ==========================================================================
  # PARENT AUTHORIZATION - Parents can complete everything
  # ==========================================================================

  test "parent can complete personal subject" do
    sign_in_as @parent
    post select_student_path(@student_in_group)
    # Clean up any existing completions for this date
    @personal_subject.completions.where(date: @test_date).destroy_all

    travel_to @test_date do
      assert_difference -> { Completion.count }, 1 do
        post toggle_completion_path(subject_id: @personal_subject.id, date: @test_date)
      end
      assert_response :redirect
    end
  end

  test "parent can complete group subject" do
    sign_in_as @parent
    post select_student_path(@student_in_group)
    # Clean up any existing completions for this date
    @group_subject.completions.where(date: @test_date).destroy_all

    travel_to @test_date do
      assert_difference -> { Completion.count }, 1 do
        post toggle_completion_path(subject_id: @group_subject.id, date: @test_date)
      end
      assert_response :redirect
      assert_nil flash[:alert], "Should not have an error alert"
    end
  end

  # ==========================================================================
  # STUDENT AUTHORIZATION - Students can only complete their own subjects
  # ==========================================================================

  # NOTE: Integration tests for student users completing subjects are skipped
  # because the student selection flow (StudentSelection concern) requires
  # the user to own teachables via Current.user.students. Student users
  # link to their Student record differently (via user.student association).
  #
  # The student login/selection flow is out of scope for issue #37.
  # The model-level authorization (User#can_complete?) is tested below.
  #
  # TODO: When student login flow is implemented, add integration tests:
  # - test "student can complete their own personal subject"
  # - test "student cannot complete group subject"

  # ==========================================================================
  # MODEL TESTS - User#can_complete?
  # ==========================================================================

  test "User#can_complete? returns true for parent on personal subject" do
    assert @parent.can_complete?(@personal_subject),
      "Parent should be able to complete personal subjects"
  end

  test "User#can_complete? returns true for parent on group subject" do
    assert @parent.can_complete?(@group_subject),
      "Parent should be able to complete group subjects"
  end

  test "User#can_complete? returns true for student on their own subject" do
    assert @student_user.can_complete?(@personal_subject),
      "Student should be able to complete their own subjects"
  end

  test "User#can_complete? returns false for student on group subject" do
    refute @student_user.can_complete?(@group_subject),
      "Student should NOT be able to complete group subjects"
  end

  test "User#can_complete? returns false for student on another student's subject" do
    other_student_subject = subjects(:two)  # Sam's subject
    refute @student_user.can_complete?(other_student_subject),
      "Student should NOT be able to complete another student's subjects"
  end
end
