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

  test "requires teachable name when teachable is present" do
    group = StudentGroup.new(group_type: :family)
    group.build_teachable(name: "", user: @user)

    assert_not group.valid?
    assert_includes group.errors[:name], "can't be blank"
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
    group = StudentGroup.new(group_type: :family)
    group.build_teachable(name: "Family Study", user: @user)
    group.save!

    assert_equal "Family Study", group.teachable.name
    assert_equal group, group.teachable.teachable
  end

  test "destroying group destroys teachable" do
    group = StudentGroup.new(group_type: :family)
    group.build_teachable(name: "Family Study", user: @user)
    group.save!

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

  test "delegates name to teachable" do
    group = StudentGroup.new(group_type: :family)
    group.build_teachable(name: "Test Group", user: @user)
    group.save!

    assert_equal "Test Group", group.name
  end

  test "name delegation returns nil when teachable is nil" do
    group = StudentGroup.new(group_type: :family)
    assert_nil group.name
  end

  test "accepts nested attributes for teachable" do
    group = StudentGroup.new(
      group_type: :family,
      teachable_attributes: { name: "Nested Group", user: @user }
    )
    group.save!

    assert_equal "Nested Group", group.teachable.name
  end
end
