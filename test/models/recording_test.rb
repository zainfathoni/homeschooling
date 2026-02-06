require "test_helper"

class RecordingTest < ActiveSupport::TestCase
  # Validations

  test "validates date presence" do
    recording = Recording.new(student: students(:one), recordable: quick_notes(:field_trip))
    recording.date = nil
    assert_not recording.valid?
    assert_includes recording.errors[:date], "can't be blank"
  end

  # Associations

  test "belongs to student" do
    recording = recordings(:text_narration_recording)
    assert_equal students(:one), recording.student
  end

  test "has delegated type recordable" do
    narration_recording = recordings(:text_narration_recording)
    assert_equal "Narration", narration_recording.recordable_type
    assert_instance_of Narration, narration_recording.recordable

    quick_note_recording = recordings(:quick_note_recording)
    assert_equal "QuickNote", quick_note_recording.recordable_type
    assert_instance_of QuickNote, quick_note_recording.recordable
  end

  test "student has many recordings" do
    assert_includes students(:one).recordings, recordings(:text_narration_recording)
    assert_includes students(:one).recordings, recordings(:quick_note_recording)
  end

  test "destroying student destroys recordings" do
    student = students(:one)
    recording_ids = student.recordings.pluck(:id)
    assert recording_ids.any?

    student.destroy
    recording_ids.each do |id|
      assert_nil Recording.find_by(id: id)
    end
  end

  test "destroying recording destroys recordable" do
    recording = recordings(:quick_note_recording)
    quick_note_id = recording.recordable_id

    recording.destroy
    assert_nil QuickNote.find_by(id: quick_note_id)
  end

  # Scopes

  test "for_date scope returns recordings for specific date" do
    date = Date.new(2026, 1, 26)
    results = Recording.for_date(date)
    assert_includes results, recordings(:text_narration_recording)
    assert_not_includes results, recordings(:another_text_recording)
  end

  test "recent scope orders by date and created_at descending" do
    results = Recording.recent
    # Most recent date should be first
    assert_equal Date.new(2026, 1, 27), results.first.date
    # For same date, most recently created should be first
    same_date_results = Recording.for_date(Date.new(2026, 1, 26)).recent
    timestamps = same_date_results.pluck(:created_at)
    assert_equal timestamps, timestamps.sort.reverse
  end

  # Delegated type helpers

  test "narration? returns true for Narration recordables" do
    assert recordings(:text_narration_recording).narration?
    assert_not recordings(:quick_note_recording).narration?
  end

  test "quick_note? returns true for QuickNote recordables" do
    assert recordings(:quick_note_recording).quick_note?
    assert_not recordings(:text_narration_recording).quick_note?
  end
end
