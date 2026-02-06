require "test_helper"

class QuickNoteTest < ActiveSupport::TestCase
  # Validations

  test "validates content presence" do
    quick_note = QuickNote.new
    assert_not quick_note.valid?
    assert_includes quick_note.errors[:content], "can't be blank"
  end

  test "valid with content" do
    quick_note = QuickNote.new(content: "Field trip today")
    assert quick_note.valid?
  end

  # Associations

  test "has one recording" do
    quick_note = quick_notes(:field_trip)
    recording = recordings(:quick_note_recording)
    assert_equal recording, quick_note.recording
  end

  test "destroying quick_note destroys recording" do
    quick_note = quick_notes(:field_trip)
    recording_id = quick_note.recording.id

    quick_note.destroy
    assert_nil Recording.find_by(id: recording_id)
  end

  # Delegation

  test "delegates student to recording" do
    quick_note = quick_notes(:field_trip)
    assert_equal students(:one), quick_note.student
  end

  test "delegates student_id to recording" do
    quick_note = quick_notes(:field_trip)
    assert_equal students(:one).id, quick_note.student_id
  end

  test "delegates date to recording" do
    quick_note = quick_notes(:field_trip)
    assert_equal Date.new(2026, 1, 26), quick_note.date
  end

  # Creation via Recording

  test "can create with recording attributes" do
    student = students(:one)
    date = Date.current
    content = "New quick note"

    quick_note = QuickNote.create!(content: content)
    recording = Recording.create!(
      student: student,
      date: date,
      recordable: quick_note
    )

    assert_equal student, quick_note.reload.student
    assert_equal date, quick_note.date
    assert_equal content, quick_note.content
  end
end
