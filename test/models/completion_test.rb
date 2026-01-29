require "test_helper"

class CompletionTest < ActiveSupport::TestCase
  test "requires date" do
    completion = Completion.new(subject: subjects(:one))
    assert_not completion.valid?
    assert_includes completion.errors[:date], "can't be blank"
  end

  test "requires subject" do
    completion = Completion.new(date: Date.current)
    assert_not completion.valid?
    assert_includes completion.errors[:subject], "must exist"
  end

  test "prevents duplicate completions for same subject and date" do
    existing = completions(:one)
    duplicate = Completion.new(subject: existing.subject, date: existing.date)
    assert_not duplicate.valid?
    assert_includes duplicate.errors[:subject_id], "already has a completion for this date"
  end

  test "allows completions for same subject on different dates" do
    existing = completions(:one)
    new_completion = Completion.new(subject: existing.subject, date: existing.date + 1.day)
    assert new_completion.valid?
  end

  test "fixed subject does not require subject_option" do
    completion = Completion.new(
      subject: subjects(:one),
      date: Date.current
    )
    assert completion.valid?
  end

  test "scheduled subject does not require subject_option" do
    completion = Completion.new(
      subject: subjects(:scheduled_coding),
      date: Date.current
    )
    assert completion.valid?
  end

  test "pick1 subject requires subject_option" do
    completion = Completion.new(
      subject: subjects(:pick1_islamic),
      date: Date.current
    )
    assert_not completion.valid?
    assert_includes completion.errors[:subject_option], "can't be blank"
  end

  test "pick1 subject is valid with subject_option" do
    completion = Completion.new(
      subject: subjects(:pick1_islamic),
      date: Date.current,
      subject_option: subject_options(:safar_book)
    )
    assert completion.valid?
  end

  test "belongs to subject_option optionally" do
    completion = completions(:one)
    assert_nil completion.subject_option

    completion.subject_option = subject_options(:safar_book)
    assert_equal subject_options(:safar_book), completion.subject_option
  end
end
