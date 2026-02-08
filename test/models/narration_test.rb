require "test_helper"

class NarrationTest < ActiveSupport::TestCase
  # Validations

  test "validates narration_type presence" do
    narration = Narration.new(subject: subjects(:one))
    assert_not narration.valid?
    assert_includes narration.errors[:narration_type], "can't be blank"
  end

  test "validates narration_type inclusion" do
    assert_raises(ArgumentError) do
      Narration.new(narration_type: "invalid")
    end
  end

  test "validates content presence for text type" do
    narration = Narration.new(subject: subjects(:one), narration_type: "text")
    assert_not narration.valid?
    assert_includes narration.errors[:content], "can't be blank"
  end

  test "content not required for voice type" do
    narration = Narration.new(subject: subjects(:one), narration_type: "voice")
    narration.valid?
    assert_not_includes narration.errors[:content], "can't be blank"
  end

  test "content not required for photo type" do
    narration = Narration.new(subject: subjects(:one), narration_type: "photo")
    narration.valid?
    assert_not_includes narration.errors[:content], "can't be blank"
  end

  test "content not required for video type" do
    narration = Narration.new(subject: subjects(:one), narration_type: "video")
    narration.valid?
    assert_not_includes narration.errors[:content], "can't be blank"
  end

  test "validates media presence for voice type" do
    narration = Narration.new(subject: subjects(:one), narration_type: "voice")
    assert_not narration.valid?
    assert_includes narration.errors[:media], "can't be blank"
  end

  test "validates media presence for photo type" do
    narration = Narration.new(subject: subjects(:one), narration_type: "photo")
    assert_not narration.valid?
    assert_includes narration.errors[:media], "can't be blank"
  end

  test "validates media presence for video type" do
    narration = Narration.new(subject: subjects(:one), narration_type: "video")
    assert_not narration.valid?
    assert_includes narration.errors[:media], "can't be blank"
  end

  test "media not required for text type" do
    narration = Narration.new(subject: subjects(:one), narration_type: "text", content: "Test")
    narration.valid?
    assert_not_includes narration.errors[:media], "can't be blank"
  end

  test "validates student matches subject's student for individual subject" do
    # Try to create a narration where student doesn't match subject owner
    # Subject one belongs to student one
    narration = narrations(:text_narration) # already has correct student

    # Change the recording to use wrong student
    narration.recording.update(student: students(:two))
    narration.reload

    # Validation should fail
    assert_not narration.valid?
    assert_includes narration.errors[:subject], "must belong to the same student"
  end

  test "valid when student matches subject's student" do
    narration = Narration.create!(
      subject: subjects(:one),
      narration_type: "text",
      content: "Test"
    )

    recording = Recording.new(
      student: students(:one),
      date: Date.current,
      recordable: narration
    )

    assert recording.valid?
  end

  # Associations

  test "belongs to subject" do
    narration = narrations(:text_narration)
    assert_equal subjects(:one), narration.subject
  end

  test "has one recording" do
    narration = narrations(:text_narration)
    recording = recordings(:text_narration_recording)
    assert_equal recording, narration.recording
  end

  test "student has many narrations through recordings" do
    assert_includes students(:one).narrations, narrations(:text_narration)
  end

  test "subject has many narrations" do
    assert_includes subjects(:one).narrations, narrations(:text_narration)
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

  test "destroying narration destroys recording" do
    narration = narrations(:text_narration)
    recording_id = narration.recording.id

    narration.destroy
    assert_nil Recording.find_by(id: recording_id)
  end

  # Delegation

  test "delegates student to recording" do
    narration = narrations(:text_narration)
    assert_equal students(:one), narration.student
  end

  test "delegates student_id to recording" do
    narration = narrations(:text_narration)
    assert_equal students(:one).id, narration.student_id
  end

  test "delegates date to recording" do
    narration = narrations(:text_narration)
    assert_equal Date.new(2026, 1, 26), narration.date
  end

  # Enums

  test "text? returns true for text type" do
    narration = narrations(:text_narration)
    assert narration.text?
    assert_not narration.voice?
    assert_not narration.photo?
    assert_not narration.video?
  end

  test "video type is a valid narration_type" do
    narration = Narration.new(subject: subjects(:one), narration_type: "video")
    assert narration.video?
  end

  # Content type validation

  test "voice narration rejects non-audio media" do
    narration = Narration.new(subject: subjects(:one), narration_type: "voice")
    narration.media.attach(
      io: StringIO.new("fake image data"),
      filename: "test.jpg",
      content_type: "image/jpeg"
    )
    assert_not narration.valid?
    assert_includes narration.errors[:media], "must be a voice file"
  end

  test "photo narration rejects non-image media" do
    narration = Narration.new(subject: subjects(:one), narration_type: "photo")
    narration.media.attach(
      io: StringIO.new("fake audio data"),
      filename: "test.mp3",
      content_type: "audio/mpeg"
    )
    assert_not narration.valid?
    assert_includes narration.errors[:media], "must be a photo file"
  end

  test "video narration rejects non-video media" do
    narration = Narration.new(subject: subjects(:one), narration_type: "video")
    narration.media.attach(
      io: StringIO.new("fake image data"),
      filename: "test.jpg",
      content_type: "image/jpeg"
    )
    assert_not narration.valid?
    assert_includes narration.errors[:media], "must be a video file"
  end

  test "voice narration accepts audio media" do
    narration = Narration.new(subject: subjects(:one), narration_type: "voice")
    narration.media.attach(
      io: StringIO.new("fake audio data"),
      filename: "test.mp3",
      content_type: "audio/mpeg"
    )
    narration.valid?
    assert_not_includes narration.errors[:media], "must be a voice file"
  end

  test "photo narration accepts image media" do
    narration = Narration.new(subject: subjects(:one), narration_type: "photo")
    narration.media.attach(
      io: StringIO.new("fake image data"),
      filename: "test.jpg",
      content_type: "image/jpeg"
    )
    narration.valid?
    assert_not_includes narration.errors[:media], "must be a photo file"
  end

  test "video narration accepts video media" do
    narration = Narration.new(subject: subjects(:one), narration_type: "video")
    narration.media.attach(
      io: StringIO.new("fake video data"),
      filename: "test.mp4",
      content_type: "video/mp4"
    )
    narration.valid?
    assert_not_includes narration.errors[:media], "must be a video file"
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
    assert_includes results, narrations(:another_text)
    # All narrations in fixtures belong to student one
    assert_equal 2, results.count
  end

  test "for_subject scope returns narrations for specific subject" do
    results = Narration.for_subject(subjects(:one))
    assert_includes results, narrations(:text_narration)
    assert_includes results, narrations(:another_text)
    assert_equal 2, results.count
  end

  test "recent scope orders by recording date and created_at descending" do
    results = Narration.recent
    # Get the dates in order
    dates = results.joins(:recording).pluck("recordings.date")
    assert_equal dates, dates.sort.reverse
  end

  # Creation via Recording

  test "can create with recording" do
    student = students(:one)
    subject = subjects(:one)
    date = Date.current
    content = "New narration"

    narration = Narration.create!(
      subject: subject,
      narration_type: "text",
      content: content
    )

    recording = Recording.create!(
      student: student,
      date: date,
      recordable: narration
    )

    assert_equal student, narration.reload.student
    assert_equal date, narration.date
    assert_equal subject, narration.subject
    assert_equal content, narration.content
  end
end
