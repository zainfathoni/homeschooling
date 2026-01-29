require "test_helper"

class NarrationTest < ActiveSupport::TestCase
  # Validations

  test "validates date presence" do
    narration = Narration.new(student: students(:one), subject: subjects(:one), narration_type: "text", content: "Test")
    narration.date = nil
    assert_not narration.valid?
    assert_includes narration.errors[:date], "can't be blank"
  end

  test "validates narration_type presence" do
    narration = Narration.new(student: students(:one), subject: subjects(:one), date: Date.current)
    assert_not narration.valid?
    assert_includes narration.errors[:narration_type], "can't be blank"
  end

  test "validates narration_type inclusion" do
    assert_raises(ArgumentError) do
      Narration.new(narration_type: "invalid")
    end
  end

  test "validates content presence for text type" do
    narration = Narration.new(student: students(:one), subject: subjects(:one), date: Date.current, narration_type: "text")
    assert_not narration.valid?
    assert_includes narration.errors[:content], "can't be blank"
  end

  test "content not required for voice type" do
    narration = Narration.new(student: students(:one), subject: subjects(:one), date: Date.current, narration_type: "voice")
    narration.valid?
    assert_not_includes narration.errors[:content], "can't be blank"
  end

  test "content not required for photo type" do
    narration = Narration.new(student: students(:one), subject: subjects(:one), date: Date.current, narration_type: "photo")
    narration.valid?
    assert_not_includes narration.errors[:content], "can't be blank"
  end

  test "validates media presence for voice type" do
    narration = Narration.new(student: students(:one), subject: subjects(:one), date: Date.current, narration_type: "voice")
    assert_not narration.valid?
    assert_includes narration.errors[:media], "can't be blank"
  end

  test "validates media presence for photo type" do
    narration = Narration.new(student: students(:one), subject: subjects(:one), date: Date.current, narration_type: "photo")
    assert_not narration.valid?
    assert_includes narration.errors[:media], "can't be blank"
  end

  test "media not required for text type" do
    narration = Narration.new(student: students(:one), subject: subjects(:one), date: Date.current, narration_type: "text", content: "Test")
    narration.valid?
    assert_not_includes narration.errors[:media], "can't be blank"
  end

  test "validates student matches subject's student" do
    narration = Narration.new(
      student: students(:two),
      subject: subjects(:one),
      date: Date.current,
      narration_type: "text",
      content: "Test"
    )
    assert_not narration.valid?
    assert_includes narration.errors[:subject], "must belong to the same student"
  end

  test "valid when student matches subject's student" do
    narration = Narration.new(
      student: students(:one),
      subject: subjects(:one),
      date: Date.current,
      narration_type: "text",
      content: "Test"
    )
    assert narration.valid?
  end

  # Associations

  test "belongs to student" do
    narration = narrations(:text_narration)
    assert_equal students(:one), narration.student
  end

  test "belongs to subject" do
    narration = narrations(:text_narration)
    assert_equal subjects(:one), narration.subject
  end

  test "student has many narrations" do
    assert_includes students(:one).narrations, narrations(:text_narration)
  end

  test "subject has many narrations" do
    assert_includes subjects(:one).narrations, narrations(:text_narration)
  end

  test "destroying student destroys narrations" do
    student = students(:one)
    narration_ids = student.narrations.pluck(:id)
    assert narration_ids.any?

    student.destroy
    narration_ids.each do |id|
      assert_nil Narration.find_by(id: id)
    end
  end

  test "destroying subject destroys narrations" do
    subject = subjects(:one)
    narration_ids = subject.narrations.pluck(:id)
    assert narration_ids.any?

    subject.destroy
    narration_ids.each do |id|
      assert_nil Narration.find_by(id: id)
    end
  end

  # Enums

  test "text? returns true for text type" do
    narration = narrations(:text_narration)
    assert narration.text?
    assert_not narration.voice?
    assert_not narration.photo?
  end

  # Scopes

  test "for_date scope returns narrations for specific date" do
    date = Date.new(2026, 1, 26)
    results = Narration.for_date(date)
    assert_includes results, narrations(:text_narration)
    assert_not_includes results, narrations(:another_text)
  end

  test "for_student scope returns narrations for specific student" do
    results = Narration.for_student(students(:one))
    assert_includes results, narrations(:text_narration)
    assert_not_includes results, Narration.where(student: students(:two))
  end

  test "for_subject scope returns narrations for specific subject" do
    results = Narration.for_subject(subjects(:one))
    assert_includes results, narrations(:text_narration)
    assert_not_includes results, narrations(:another_text)
  end

  test "recent scope orders by created_at descending" do
    results = Narration.recent
    assert_equal results.first.created_at, results.maximum(:created_at)
  end
end
