require "test_helper"

class GroupMembershipTest < ActiveSupport::TestCase
  setup do
    @student_one = students(:one)
    @student_two = students(:two)
    @group = StudentGroup.create!(group_type: :family)
  end

  test "requires student_group" do
    membership = GroupMembership.new(student: @student_one)
    assert_not membership.valid?
    assert_includes membership.errors[:student_group], "must exist"
  end

  test "requires student" do
    membership = GroupMembership.new(student_group: @group)
    assert_not membership.valid?
    assert_includes membership.errors[:student], "must exist"
  end

  test "valid with student_group and student" do
    membership = GroupMembership.new(student_group: @group, student: @student_one)
    assert membership.valid?
  end

  test "student must be unique within group" do
    GroupMembership.create!(student_group: @group, student: @student_one)

    duplicate = GroupMembership.new(student_group: @group, student: @student_one)
    assert_not duplicate.valid?
    assert_includes duplicate.errors[:student_id], "has already been taken"
  end

  test "same student can be in different groups" do
    group2 = StudentGroup.create!(group_type: :joint)
    GroupMembership.create!(student_group: @group, student: @student_one)

    membership2 = GroupMembership.new(student_group: group2, student: @student_one)
    assert membership2.valid?
  end

  test "different students can be in same group" do
    GroupMembership.create!(student_group: @group, student: @student_one)

    membership2 = GroupMembership.new(student_group: @group, student: @student_two)
    assert membership2.valid?
  end

  test "belongs_to student_group" do
    membership = GroupMembership.create!(student_group: @group, student: @student_one)
    assert_equal @group, membership.student_group
  end

  test "belongs_to student" do
    membership = GroupMembership.create!(student_group: @group, student: @student_one)
    assert_equal @student_one, membership.student
  end
end
