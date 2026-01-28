require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "valid user" do
    user = User.new(email: "test@example.com", name: "Test", password: "password123")
    assert user.valid?
  end

  test "requires email" do
    user = User.new(name: "Test", password: "password123")
    assert_not user.valid?
    assert_includes user.errors[:email], "can't be blank"
  end

  test "requires name" do
    user = User.new(email: "test@example.com", password: "password123")
    assert_not user.valid?
    assert_includes user.errors[:name], "can't be blank"
  end

  test "requires unique email" do
    User.create!(email: "test@example.com", name: "First", password: "password123")
    user = User.new(email: "test@example.com", name: "Second", password: "password123")
    assert_not user.valid?
    assert_includes user.errors[:email], "has already been taken"
  end

  test "normalizes email to lowercase" do
    user = User.create!(email: "TEST@Example.COM", name: "Test", password: "password123")
    assert_equal "test@example.com", user.email
  end

  test "validates email format" do
    user = User.new(email: "invalid", name: "Test", password: "password123")
    assert_not user.valid?
    assert_includes user.errors[:email], "is invalid"
  end
end
