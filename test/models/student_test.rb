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

  test "all_subjects memoizes teachable_ids to reduce queries" do
    # First call calculates and caches teachable_ids
    @student.all_subjects.to_a

    # Second call should not re-query for group teachable ids
    query_count = 0
    callback = ->(*, payload) { query_count += 1 unless payload[:name] == "SCHEMA" }
    ActiveSupport::Notifications.subscribed(callback, "sql.active_record") do
      @student.all_subjects.to_a
    end

    # Only 1 query for Subject.where(...), no query for group_ids pluck
    assert_equal 1, query_count, "Expected memoization to skip teachable_ids query on second call"
  end

  test "destroying student destroys teachable" do
    teachable_id = @student.teachable.id
    @student.destroy
    assert_nil Teachable.find_by(id: teachable_id)
  end

  test "validation error when teachable name is blank" do
    student = Student.new
    student.build_teachable(name: "", user: @user)

    assert_not student.valid?
    assert_includes student.errors[:name], "can't be blank"
  end

  test "valid when teachable has name" do
    student = Student.new
    student.build_teachable(name: "Valid Name", user: @user)

    assert student.valid?
  end

  test "rejects javascript url scheme" do
    @student.avatar_url = "javascript:alert(1)"
    assert_not @student.valid?
    assert_includes @student.errors[:avatar_url], "must use http or https"
  end

  test "rejects data url scheme" do
    @student.avatar_url = "data:text/html,test"
    assert_not @student.valid?
    assert_predicate @student.errors[:avatar_url], :present?
  end

  test "accepts http avatar url" do
    @student.avatar_url = "http://example.com/avatar.png"
    assert @student.valid?
  end

  test "accepts https avatar url" do
    @student.avatar_url = "https://example.com/avatar.png"
    assert @student.valid?
  end

  test "accepts blank avatar url" do
    @student.avatar_url = nil
    assert @student.valid?
  end

  test "rejects invalid avatar url" do
    @student.avatar_url = "not a valid url with spaces%%"
    assert_not @student.valid?
    assert_includes @student.errors[:avatar_url], "is not a valid URL"
  end

  test "safe_avatar_url returns nil for javascript scheme" do
    @student.avatar_url = "javascript:alert(1)"
    assert_nil @student.safe_avatar_url
  end

  test "safe_avatar_url returns nil for data scheme" do
    @student.avatar_url = "data:text/html,test"
    assert_nil @student.safe_avatar_url
  end

  test "safe_avatar_url returns url for https scheme" do
    @student.avatar_url = "https://example.com/avatar.png"
    assert_equal "https://example.com/avatar.png", @student.safe_avatar_url
  end

  test "safe_avatar_url returns nil for blank url" do
    @student.avatar_url = nil
    assert_nil @student.safe_avatar_url
  end

  test "safe_avatar_url returns nil for invalid url" do
    @student.avatar_url = "not a valid url%%"
    assert_nil @student.safe_avatar_url
  end
end
