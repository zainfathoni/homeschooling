require "test_helper"

class TeachableTest < ActiveSupport::TestCase
  setup do
    @user = users(:parent)
    @student = students(:one)
  end

  test "requires name" do
    teachable = Teachable.new(user: @user, teachable: @student)
    assert_not teachable.valid?
    assert_includes teachable.errors[:name], "can't be blank"
  end

  test "requires user" do
    teachable = Teachable.new(name: "Test", teachable: @student)
    assert_not teachable.valid?
    assert_includes teachable.errors[:user], "must exist"
  end

  test "requires teachable_type" do
    teachable = Teachable.new(name: "Test", user: @user, teachable_id: 1)
    assert_not teachable.valid?
    assert_includes teachable.errors[:teachable_type], "can't be blank"
  end

  test "requires teachable association" do
    teachable = Teachable.new(name: "Test", user: @user, teachable_type: "Student")
    # delegated_type requires the teachable association to exist
    assert_not teachable.valid?
    assert_includes teachable.errors[:teachable], "must exist"
  end

  test "teachable_id must be unique within teachable_type" do
    # Fixture already created teachable for @student
    duplicate = Teachable.new(name: "Second", user: @user, teachable_type: "Student", teachable_id: @student.id)
    assert_not duplicate.valid?
    assert_includes duplicate.errors[:teachable_id], "has already been taken"
  end

  test "same teachable_id allowed for different teachable_types" do
    # Fixture already created teachable for @student
    group = StudentGroup.create!(group_type: :family)
    group_teachable = Teachable.new(name: "Group One", user: @user, teachable: group)

    assert group_teachable.valid?
  end

  test "valid with all required attributes" do
    new_student = Student.create!(name: "New Student")
    teachable = Teachable.new(name: "Test Student", user: @user, teachable: new_student)
    assert teachable.valid?
  end

  test "student? returns true for Student teachable" do
    teachable = Teachable.new(name: "Test", user: @user, teachable_type: "Student", teachable_id: 1)
    assert teachable.student?
    assert_not teachable.student_group?
  end

  test "student_group? returns true for StudentGroup teachable" do
    teachable = Teachable.new(name: "Test", user: @user, teachable_type: "StudentGroup", teachable_id: 1)
    assert teachable.student_group?
    assert_not teachable.student?
  end

  test "students scope returns only Student teachables" do
    # Fixtures already created teachables for students
    group = StudentGroup.create!(group_type: :family)
    Teachable.create!(name: "Group", user: @user, teachable: group)

    student_teachables = Teachable.students
    assert student_teachables.all? { |t| t.teachable_type == "Student" }
  end

  test "student_groups scope returns only StudentGroup teachables" do
    # Fixtures already created teachables for students
    group = StudentGroup.create!(group_type: :family)
    Teachable.create!(name: "Group", user: @user, teachable: group)

    group_teachables = Teachable.student_groups
    assert group_teachables.all? { |t| t.teachable_type == "StudentGroup" }
  end

  test "for_user scope returns teachables for specific user" do
    # Fixtures already created teachables for students with users
    parent_teachables = Teachable.for_user(@user)
    assert parent_teachables.all? { |t| t.user == @user }
    assert parent_teachables.count >= 2 # students :one and :three belong to parent
  end
end
