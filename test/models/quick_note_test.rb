require "test_helper"

class QuickNoteTest < ActiveSupport::TestCase
  # Validations

  test "invalid without content or audio" do
    quick_note = QuickNote.new
    assert_not quick_note.valid?
    assert_includes quick_note.errors[:base], "Must provide either text content or an audio recording"
  end

  test "valid with content only" do
    quick_note = QuickNote.new(content: "Field trip today")
    assert quick_note.valid?
  end

  test "valid with audio only" do
    quick_note = QuickNote.new
    quick_note.audio.attach(
      io: StringIO.new("fake audio data"),
      filename: "note.wav",
      content_type: "audio/wav"
    )
    assert quick_note.valid?
  end

  test "valid with both content and audio" do
    quick_note = QuickNote.new(content: "Field trip today")
    quick_note.audio.attach(
      io: StringIO.new("fake audio data"),
      filename: "note.wav",
      content_type: "audio/wav"
    )
    assert quick_note.valid?
  end

  test "rejects non-audio file" do
    quick_note = QuickNote.new
    quick_note.audio.attach(
      io: StringIO.new("fake image data"),
      filename: "photo.jpg",
      content_type: "image/jpeg"
    )
    assert_not quick_note.valid?
    assert_includes quick_note.errors[:audio], "must be an audio file"
  end

  test "accepts various audio content types" do
    %w[audio/wav audio/mpeg audio/ogg audio/webm audio/mp4].each do |content_type|
      quick_note = QuickNote.new
      quick_note.audio.attach(
        io: StringIO.new("fake audio data"),
        filename: "note.#{content_type.split('/').last}",
        content_type: content_type
      )
      quick_note.valid?
      assert_not_includes quick_note.errors[:audio], "must be an audio file",
        "Expected #{content_type} to be accepted"
    end
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

  test "can create text note with recording" do
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
    assert_not quick_note.audio.attached?
  end

  test "can create voice note with recording" do
    student = students(:one)
    date = Date.current

    quick_note = QuickNote.new
    quick_note.audio.attach(
      io: StringIO.new("fake audio data"),
      filename: "note.wav",
      content_type: "audio/wav"
    )
    quick_note.save!

    recording = Recording.create!(
      student: student,
      date: date,
      recordable: quick_note
    )

    assert_equal student, quick_note.reload.student
    assert_nil quick_note.content
    assert quick_note.audio.attached?
  end

  # Active Storage

  test "has one attached audio" do
    quick_note = QuickNote.new(content: "Note with audio")
    quick_note.audio.attach(
      io: StringIO.new("fake audio data"),
      filename: "note.wav",
      content_type: "audio/wav"
    )
    quick_note.save!

    assert quick_note.audio.attached?
    assert_equal "audio/wav", quick_note.audio.content_type
  end
end
