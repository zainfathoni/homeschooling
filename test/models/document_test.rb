require "test_helper"

class DocumentTest < ActiveSupport::TestCase
  # Validations

  test "validates document_type presence" do
    document = Document.new(subject: subjects(:one))
    assert_not document.valid?
    assert_includes document.errors[:document_type], "can't be blank"
  end

  test "validates document_type inclusion" do
    assert_raises(ArgumentError) do
      Document.new(document_type: "invalid")
    end
  end

  test "validates content presence for text type" do
    document = Document.new(subject: subjects(:one), document_type: "text")
    assert_not document.valid?
    assert_includes document.errors[:content], "can't be blank"
  end

  test "content not required for voice type" do
    document = Document.new(subject: subjects(:one), document_type: "voice")
    document.valid?
    assert_not_includes document.errors[:content], "can't be blank"
  end

  test "content not required for photo type" do
    document = Document.new(subject: subjects(:one), document_type: "photo")
    document.valid?
    assert_not_includes document.errors[:content], "can't be blank"
  end

  test "content not required for video type" do
    document = Document.new(subject: subjects(:one), document_type: "video")
    document.valid?
    assert_not_includes document.errors[:content], "can't be blank"
  end

  test "validates media presence for voice type" do
    document = Document.new(subject: subjects(:one), document_type: "voice")
    assert_not document.valid?
    assert_includes document.errors[:media], "can't be blank"
  end

  test "validates media presence for photo type" do
    document = Document.new(subject: subjects(:one), document_type: "photo")
    assert_not document.valid?
    assert_includes document.errors[:media], "can't be blank"
  end

  test "validates media presence for video type" do
    document = Document.new(subject: subjects(:one), document_type: "video")
    assert_not document.valid?
    assert_includes document.errors[:media], "can't be blank"
  end

  test "media not required for text type" do
    document = Document.new(subject: subjects(:one), document_type: "text", content: "Test")
    document.valid?
    assert_not_includes document.errors[:media], "can't be blank"
  end

  test "validates student matches subject's student for individual subject" do
    # Try to create a document where student doesn't match subject owner
    # Subject one belongs to student one
    document = documents(:text_document) # already has correct student

    # Change the recording to use wrong student
    document.recording.update(student: students(:two))
    document.reload

    # Validation should fail
    assert_not document.valid?
    assert_includes document.errors[:subject], "must belong to the same student"
  end

  test "valid when student matches subject's student" do
    document = Document.create!(
      subject: subjects(:one),
      document_type: "text",
      content: "Test"
    )

    recording = Recording.new(
      student: students(:one),
      date: Date.current,
      recordable: document
    )

    assert recording.valid?
  end

  # Associations

  test "belongs to subject" do
    document = documents(:text_document)
    assert_equal subjects(:one), document.subject
  end

  test "has one recording" do
    document = documents(:text_document)
    recording = recordings(:text_document_recording)
    assert_equal recording, document.recording
  end

  test "student has many documents through recordings" do
    assert_includes students(:one).documents, documents(:text_document)
  end

  test "subject has many documents" do
    assert_includes subjects(:one).documents, documents(:text_document)
  end

  test "destroying subject destroys documents" do
    subject = subjects(:one)
    document_ids = subject.documents.pluck(:id)
    assert document_ids.any?

    subject.destroy
    document_ids.each do |id|
      assert_nil Document.find_by(id: id)
    end
  end

  test "destroying document destroys recording" do
    document = documents(:text_document)
    recording_id = document.recording.id

    document.destroy
    assert_nil Recording.find_by(id: recording_id)
  end

  # Delegation

  test "delegates student to recording" do
    document = documents(:text_document)
    assert_equal students(:one), document.student
  end

  test "delegates student_id to recording" do
    document = documents(:text_document)
    assert_equal students(:one).id, document.student_id
  end

  test "delegates date to recording" do
    document = documents(:text_document)
    assert_equal Date.new(2026, 1, 26), document.date
  end

  # Enums

  test "text? returns true for text type" do
    document = documents(:text_document)
    assert document.text?
    assert_not document.voice?
    assert_not document.photo?
    assert_not document.video?
  end

  test "video type is a valid document_type" do
    document = Document.new(subject: subjects(:one), document_type: "video")
    assert document.video?
  end

  # Content type validation

  test "voice document rejects non-audio media" do
    document = Document.new(subject: subjects(:one), document_type: "voice")
    document.media.attach(
      io: StringIO.new("fake image data"),
      filename: "test.jpg",
      content_type: "image/jpeg"
    )
    assert_not document.valid?
    assert_includes document.errors[:media], "must be a voice file"
  end

  test "photo document rejects non-image media" do
    document = Document.new(subject: subjects(:one), document_type: "photo")
    document.media.attach(
      io: StringIO.new("fake audio data"),
      filename: "test.mp3",
      content_type: "audio/mpeg"
    )
    assert_not document.valid?
    assert_includes document.errors[:media], "must be a photo file"
  end

  test "video document rejects non-video media" do
    document = Document.new(subject: subjects(:one), document_type: "video")
    document.media.attach(
      io: StringIO.new("fake image data"),
      filename: "test.jpg",
      content_type: "image/jpeg"
    )
    assert_not document.valid?
    assert_includes document.errors[:media], "must be a video file"
  end

  test "voice document accepts audio media" do
    document = Document.new(subject: subjects(:one), document_type: "voice")
    document.media.attach(
      io: StringIO.new("fake audio data"),
      filename: "test.mp3",
      content_type: "audio/mpeg"
    )
    document.valid?
    assert_not_includes document.errors[:media], "must be a voice file"
  end

  test "photo document accepts image media" do
    document = Document.new(subject: subjects(:one), document_type: "photo")
    document.media.attach(
      io: StringIO.new("fake image data"),
      filename: "test.jpg",
      content_type: "image/jpeg"
    )
    document.valid?
    assert_not_includes document.errors[:media], "must be a photo file"
  end

  test "video document accepts video media" do
    document = Document.new(subject: subjects(:one), document_type: "video")
    document.media.attach(
      io: StringIO.new("fake video data"),
      filename: "test.mp4",
      content_type: "video/mp4"
    )
    document.valid?
    assert_not_includes document.errors[:media], "must be a video file"
  end

  # Scopes

  test "for_date scope returns documents for specific date" do
    date = Date.new(2026, 1, 26)
    results = Document.for_date(date)
    assert_includes results, documents(:text_document)
    assert_not_includes results, documents(:another_text)
  end

  test "for_student scope returns documents for specific student" do
    results = Document.for_student(students(:one))
    assert_includes results, documents(:text_document)
    assert_includes results, documents(:another_text)
    # All documents in fixtures belong to student one
    assert_equal 2, results.count
  end

  test "for_subject scope returns documents for specific subject" do
    results = Document.for_subject(subjects(:one))
    assert_includes results, documents(:text_document)
    assert_includes results, documents(:another_text)
    assert_equal 2, results.count
  end

  test "recent scope orders by recording date and created_at descending" do
    results = Document.recent
    # Get the dates in order
    dates = results.joins(:recording).pluck("recordings.date")
    assert_equal dates, dates.sort.reverse
  end

  # Creation via Recording

  test "can create with recording" do
    student = students(:one)
    subject = subjects(:one)
    date = Date.current
    content = "New document"

    document = Document.create!(
      subject: subject,
      document_type: "text",
      content: content
    )

    recording = Recording.create!(
      student: student,
      date: date,
      recordable: document
    )

    assert_equal student, document.reload.student
    assert_equal date, document.date
    assert_equal subject, document.subject
    assert_equal content, document.content
  end
end
