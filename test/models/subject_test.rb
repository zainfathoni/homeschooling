require "test_helper"

class SubjectTest < ActiveSupport::TestCase
  test "validates name presence" do
    subject = Subject.new(teachable: teachables(:student_one_teachable), subject_type: "fixed")
    assert_not subject.valid?
    assert_includes subject.errors[:name], "can't be blank"
  end

  test "validates subject_type inclusion" do
    assert_raises(ArgumentError) do
      Subject.new(name: "Test", teachable: teachables(:student_one_teachable), subject_type: "invalid")
    end
  end

  test "validates scheduled_days presence for scheduled type" do
    subject = Subject.new(name: "Test", teachable: teachables(:student_one_teachable), subject_type: "scheduled")
    assert_not subject.valid?
    assert_includes subject.errors[:scheduled_days], "can't be blank"
  end

  test "scheduled_days not required for fixed type" do
    subject = Subject.new(name: "Test", teachable: teachables(:student_one_teachable), subject_type: "fixed")
    assert subject.valid?
  end

  test "scheduled_days not required for pick1 type" do
    subject = Subject.new(name: "Test", teachable: teachables(:student_one_teachable), subject_type: "pick1")
    assert subject.valid?
  end

  test "active_on? returns true for fixed subjects on any weekday" do
    subject = subjects(:one)
    assert subject.fixed?
    assert subject.active_on?(Date.new(2026, 1, 26)) # Monday
    assert subject.active_on?(Date.new(2026, 1, 30)) # Friday
  end

  test "active_on? returns false for fixed subjects on weekends" do
    subject = subjects(:one)
    assert_not subject.active_on?(Date.new(2026, 1, 31)) # Saturday
    assert_not subject.active_on?(Date.new(2026, 2, 1))  # Sunday
  end

  test "active_on? returns true for pick1 subjects on weekdays" do
    subject = subjects(:pick1_islamic)
    assert subject.pick1?
    assert subject.active_on?(Date.new(2026, 1, 26)) # Monday
    assert subject.active_on?(Date.new(2026, 1, 30)) # Friday
  end

  test "active_on? returns false for pick1 subjects on weekends" do
    subject = subjects(:pick1_islamic)
    assert_not subject.active_on?(Date.new(2026, 1, 31)) # Saturday
    assert_not subject.active_on?(Date.new(2026, 2, 1))  # Sunday
  end

  test "active_on? returns true for scheduled subjects on active days" do
    subject = subjects(:scheduled_coding)
    assert subject.scheduled?
    assert_equal [ 0, 1, 2, 3 ], subject.scheduled_days
    assert subject.active_on?(Date.new(2026, 1, 26)) # Monday (0)
    assert subject.active_on?(Date.new(2026, 1, 27)) # Tuesday (1)
    assert subject.active_on?(Date.new(2026, 1, 28)) # Wednesday (2)
    assert subject.active_on?(Date.new(2026, 1, 29)) # Thursday (3)
  end

  test "active_on? returns false for scheduled subjects on off-days" do
    subject = subjects(:scheduled_coding)
    assert_not subject.active_on?(Date.new(2026, 1, 30)) # Friday (4) not in scheduled_days
  end

  test "active_on? returns false for scheduled subjects on weekends" do
    subject = subjects(:scheduled_coding)
    assert_not subject.active_on?(Date.new(2026, 1, 31)) # Saturday
    assert_not subject.active_on?(Date.new(2026, 2, 1))  # Sunday
  end

  test "existing subjects default to fixed type" do
    subject = Subject.create!(name: "New Subject", teachable: teachables(:student_one_teachable))
    assert_equal "fixed", subject.subject_type
    assert subject.fixed?
  end

  test "narration_required defaults to false" do
    subject = Subject.create!(name: "New Subject", teachable: teachables(:student_one_teachable))
    assert_equal false, subject.narration_required
  end

  test "has_document_for? returns true when document exists for date" do
    subject = subjects(:one)
    date = Date.new(2026, 1, 26)
    assert subject.has_document_for?(date)
  end

  test "has_document_for? returns false when no document exists for date" do
    subject = subjects(:one)
    date = Date.new(2026, 1, 28)
    assert_not subject.has_document_for?(date)
  end

  test "has_document_for? returns false for subject with no documents" do
    subject = subjects(:two)
    date = Date.new(2026, 1, 26)
    assert_not subject.has_document_for?(date)
  end

  # View compatibility helper tests
  test "student_for_document returns owner student for individual subject" do
    subject = subjects(:one)
    other_student = students(:two)
    assert_equal students(:one), subject.student_for_document(other_student)
  end

  test "for_student? returns true for owner student" do
    subject = subjects(:one)
    assert subject.for_student?(students(:one))
  end

  test "for_student? returns false for non-owner student" do
    subject = subjects(:one)
    assert_not subject.for_student?(students(:two))
  end

  test "owner_student returns the student for individual subject" do
    subject = subjects(:one)
    assert_equal students(:one), subject.owner_student
  end
end
