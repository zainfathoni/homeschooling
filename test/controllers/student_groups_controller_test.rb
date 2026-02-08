require "test_helper"

class StudentGroupsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:parent)
    @student = students(:one)
    @student_two = students(:three)
    @other_student = students(:two)
    @group = student_groups(:family_group)
  end

  test "redirects when not logged in" do
    get student_groups_path
    assert_redirected_to login_path
  end

  test "index shows current user's groups" do
    sign_in_as @user
    other_group = StudentGroup.new(group_type: :family)
    other_group.build_teachable(name: "Other Group", user: users(:other))
    other_group.save!
    get student_groups_path
    assert_response :success
    assert_match @group.teachable.name, response.body
    assert_no_match other_group.name, response.body
  end

  test "show displays group details" do
    sign_in_as @user
    get student_group_path(@group)
    assert_response :success
    assert_match @group.teachable.name, response.body
  end

  test "new shows form" do
    sign_in_as @user
    get new_student_group_path
    assert_response :success
    assert_select "form"
  end

  test "create adds a new group with students" do
    sign_in_as @user

    assert_difference "StudentGroup.count", 1 do
      assert_difference "GroupMembership.count", 2 do
        post student_groups_path, params: {
          student_group: {
            group_type: "family",
            teachable_attributes: { name: "Family Study" },
            student_ids: [ @student.id, @student_two.id ]
          }
        }
      end
    end

    group = StudentGroup.last
    assert_equal "Family Study", group.name
    assert_equal 2, group.students.count
    assert_redirected_to student_groups_path
  end

  test "create ignores other user's students" do
    sign_in_as @user

    assert_difference "StudentGroup.count", 1 do
      assert_difference "GroupMembership.count", 1 do
        post student_groups_path, params: {
          student_group: {
            group_type: "family",
            teachable_attributes: { name: "Joint" },
            student_ids: [ @student.id, @other_student.id ]
          }
        }
      end
    end

    group = StudentGroup.last
    assert_equal [ @student.id ], group.students.pluck(:id)
  end

  test "create fails with missing name" do
    sign_in_as @user

    assert_no_difference "StudentGroup.count" do
      post student_groups_path, params: {
        student_group: { group_type: "family", teachable_attributes: { name: "" } }
      }
    end

    assert_response :unprocessable_entity
  end

  test "edit shows form" do
    sign_in_as @user
    get edit_student_group_path(@group)
    assert_response :success
  end

  test "update changes group and memberships" do
    sign_in_as @user

    patch student_group_path(@group), params: {
      student_group: {
        group_type: "joint",
        teachable_attributes: { id: @group.teachable.id, name: "Updated Group" },
        student_ids: [ @student.id ]
      }
    }

    assert_redirected_to student_groups_path
    assert_equal "Updated Group", @group.reload.name
    assert_equal [ @student.id ], @group.students.pluck(:id)
  end

  test "destroy removes group" do
    sign_in_as @user

    assert_difference "StudentGroup.count", -1 do
      delete student_group_path(@group)
    end

    assert_redirected_to student_groups_path
  end

  test "cannot access another user's group" do
    sign_in_as users(:other)
    get student_group_path(@group)
    assert_redirected_to student_groups_path
  end
end
