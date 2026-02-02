require "test_helper"

class TeachableWorkflowTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:parent)
    @student = students(:one)
    sign_in_as @user
  end

  test "student has teachable association" do
    assert @student.teachable.present?, "Student should have a Teachable"
    assert_equal "Student", @student.teachable.teachable_type
    assert_equal @student.id, @student.teachable.teachable_id
    assert_equal @user.id, @student.teachable.user_id
  end

  test "teachable delegates to student" do
    teachable = @student.teachable
    assert_equal @student, teachable.student
    assert teachable.student?
    assert_not teachable.student_group?
  end

  test "student group can be created with members" do
    student_one = students(:one)
    student_two = students(:two)

    group = StudentGroup.create!(group_type: "family")
    teachable = Teachable.create!(
      user: @user,
      name: "Family Group",
      teachable: group
    )

    GroupMembership.create!(student: student_one, student_group: group)
    GroupMembership.create!(student: student_two, student_group: group)

    assert_equal 2, group.students.count
    assert_includes group.students, student_one
    assert_includes group.students, student_two
    assert_equal "StudentGroup", teachable.teachable_type
    assert teachable.student_group?
  end

  test "subject belongs to teachable for individual student" do
    subject = subjects(:one)
    
    assert subject.teachable.present?, "Subject should belong to a Teachable"
    assert subject.teachable.student?, "Teachable should be a Student type"
    assert_equal @student, subject.teachable.student
  end

  test "subject can belong to student group teachable" do
    student_one = students(:one)
    student_two = students(:two)

    group = StudentGroup.create!(group_type: "family")
    teachable = Teachable.create!(
      user: @user,
      name: "Family Study Group",
      teachable: group
    )

    GroupMembership.create!(student: student_one, student_group: group)
    GroupMembership.create!(student: student_two, student_group: group)

    subject = Subject.create!(
      teachable: teachable,
      name: "Family Picture Study",
      subject_type: "fixed"
    )

    assert_equal teachable, subject.teachable
    assert subject.teachable.student_group?
    assert_equal group, subject.teachable.student_group
    assert_equal 2, subject.teachable.student_group.students.count
  end

  test "all_subjects returns individual and group subjects for student" do
    student_one = students(:one)
    student_two = students(:two)

    # Create a group with both students
    group = StudentGroup.create!(group_type: "family")
    group_teachable = Teachable.create!(
      user: @user,
      name: "Family Group",
      teachable: group
    )
    GroupMembership.create!(student: student_one, student_group: group)
    GroupMembership.create!(student: student_two, student_group: group)

    # Create a group subject
    group_subject = Subject.create!(
      teachable: group_teachable,
      name: "Family Nature Study",
      subject_type: "fixed"
    )

    # Get all subjects for student_one
    all_subjects = student_one.all_subjects

    # Should include both individual subjects and group subjects
    individual_subjects = Subject.where(teachable: student_one.teachable)
    assert individual_subjects.all? { |s| all_subjects.include?(s) }, 
      "all_subjects should include all individual subjects"
    
    assert_includes all_subjects, group_subject,
      "all_subjects should include group subjects"
  end

  test "student_for_narration helper returns owner for individual subject" do
    subject = subjects(:one)
    current_student = students(:two)

    # For individual subject, should return the owner student
    assert_equal @student, subject.student_for_narration(current_student)
  end

  test "student_for_narration helper returns current_student for group subject" do
    student_one = students(:one)
    student_two = students(:two)

    group = StudentGroup.create!(group_type: "family")
    teachable = Teachable.create!(
      user: @user,
      name: "Family Group",
      teachable: group
    )
    GroupMembership.create!(student: student_one, student_group: group)
    GroupMembership.create!(student: student_two, student_group: group)

    subject = Subject.create!(
      teachable: teachable,
      name: "Group Subject",
      subject_type: "fixed"
    )

    # For group subject, should return the provided current_student
    assert_equal student_two, subject.student_for_narration(student_two)
  end

  test "for_student? returns true for individual subject owner" do
    subject = subjects(:one)
    
    assert subject.for_student?(@student), "for_student? should return true for owner"
    assert_not subject.for_student?(students(:two)), "for_student? should return false for non-owner"
  end

  test "for_student? returns true for group members" do
    student_one = students(:one)
    student_two = students(:two)

    group = StudentGroup.create!(group_type: "family")
    teachable = Teachable.create!(
      user: @user,
      name: "Family Group",
      teachable: group
    )
    GroupMembership.create!(student: student_one, student_group: group)
    GroupMembership.create!(student: student_two, student_group: group)

    subject = Subject.create!(
      teachable: teachable,
      name: "Group Subject",
      subject_type: "fixed"
    )

    assert subject.for_student?(student_one), "for_student? should return true for group member"
    assert subject.for_student?(student_two), "for_student? should return true for group member"
  end

  test "owner_student returns student for individual subject" do
    subject = subjects(:one)
    
    assert_equal @student, subject.owner_student
  end

  test "owner_student returns nil for group subject" do
    group = StudentGroup.create!(group_type: "family")
    teachable = Teachable.create!(
      user: @user,
      name: "Family Group",
      teachable: group
    )

    subject = Subject.create!(
      teachable: teachable,
      name: "Group Subject",
      subject_type: "fixed"
    )

    assert_nil subject.owner_student
  end

  test "subject types work correctly with group teachables" do
    group = StudentGroup.create!(group_type: "joint")
    teachable = Teachable.create!(
      user: @user,
      name: "Tutoring Group",
      teachable: group
    )

    # Fixed subject
    fixed = Subject.create!(
      teachable: teachable,
      name: "Group Math",
      subject_type: "fixed"
    )
    assert fixed.fixed?

    # Scheduled subject
    scheduled = Subject.create!(
      teachable: teachable,
      name: "Group Science",
      subject_type: "scheduled",
      scheduled_days: [ 0, 2, 4 ]
    )
    assert scheduled.scheduled?
    assert_equal [ 0, 2, 4 ], scheduled.scheduled_days

    # Pick1 subject
    pick1 = Subject.create!(
      teachable: teachable,
      name: "Group Reading",
      subject_type: "pick1"
    )
    assert pick1.pick1?
  end
end
