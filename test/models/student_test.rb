require "test_helper"

class StudentTest < ActiveSupport::TestCase
  setup do
    @user = users(:parent)
    @student = students(:one)
  end

  test "student has teachable association" do
    assert_respond_to @student, :teachable
    assert_equal "Alex", @student.teachable.name
  end

  test "student delegates user to teachable" do
    assert_equal @user, @student.user
    assert_equal @user.id, @student.user_id
  end

  test "student name comes from teachable" do
    assert_equal "Alex", @student.name
    @student.teachable.update!(name: "Updated Name")
    assert_equal "Updated Name", @student.reload.name
  end

  test "student can have group memberships" do
    group = StudentGroup.create!(group_type: :family)
    Teachable.create!(name: "Family Study", user: @user, teachable: group)
    GroupMembership.create!(student: @student, student_group: group)

    assert_includes @student.student_groups, group
  end

  test "all_subjects returns individual subjects" do
    subject = subjects(:one)
    assert_includes @student.all_subjects, subject
  end

  test "destroying student destroys teachable" do
    teachable_id = @student.teachable.id
    @student.destroy
    assert_nil Teachable.find_by(id: teachable_id)
  end

  test "student validates name presence when no teachable" do
    student = Student.new(name: nil)
    assert_not student.valid?
    assert_includes student.errors[:name], "can't be blank"
  end
end
