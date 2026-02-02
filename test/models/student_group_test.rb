require "test_helper"

class StudentGroupTest < ActiveSupport::TestCase
  setup do
    @user = users(:parent)
    @student_one = students(:one)
    @student_two = students(:two)
  end

  test "requires group_type" do
    group = StudentGroup.new
    assert_not group.valid?
    assert_includes group.errors[:group_type], "can't be blank"
  end

  test "valid with group_type family" do
    group = StudentGroup.new(group_type: :family)
    assert group.valid?
  end

  test "valid with group_type joint" do
    group = StudentGroup.new(group_type: :joint)
    assert group.valid?
  end

  test "family? returns true for family group" do
    group = StudentGroup.new(group_type: :family)
    assert group.family?
    assert_not group.joint?
  end

  test "joint? returns true for joint group" do
    group = StudentGroup.new(group_type: :joint)
    assert group.joint?
    assert_not group.family?
  end

  test "can have teachable association" do
    group = StudentGroup.create!(group_type: :family)
    teachable = Teachable.create!(name: "Family Study", user: @user, teachable: group)

    assert_equal teachable, group.teachable
    assert_equal group, teachable.teachable
  end

  test "destroying group destroys teachable" do
    group = StudentGroup.create!(group_type: :family)
    Teachable.create!(name: "Family Study", user: @user, teachable: group)

    assert_difference "Teachable.count", -1 do
      group.destroy
    end
  end

  test "can have group_memberships" do
    group = StudentGroup.create!(group_type: :family)
    membership = GroupMembership.create!(student_group: group, student: @student_one)

    assert_includes group.group_memberships, membership
  end

  test "can have students through group_memberships" do
    group = StudentGroup.create!(group_type: :family)
    GroupMembership.create!(student_group: group, student: @student_one)
    GroupMembership.create!(student_group: group, student: @student_two)

    assert_includes group.students, @student_one
    assert_includes group.students, @student_two
    assert_equal 2, group.students.count
  end

  test "destroying group destroys group_memberships" do
    group = StudentGroup.create!(group_type: :family)
    GroupMembership.create!(student_group: group, student: @student_one)

    assert_difference "GroupMembership.count", -1 do
      group.destroy
    end
  end

  test "destroying group does not destroy students" do
    group = StudentGroup.create!(group_type: :family)
    GroupMembership.create!(student_group: group, student: @student_one)

    assert_no_difference "Student.count" do
      group.destroy
    end
  end
end
