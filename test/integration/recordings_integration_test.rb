require "test_helper"

class RecordingsIntegrationTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:parent)
    @student = students(:one)
    sign_in_as @user
    post select_student_path(@student)
  end

  # Timeline Display Tests

  test "notes timeline shows both quick notes and documents" do
    get notes_path

    assert_response :success
    assert_match "Field trip to the museum", response.body
    assert_match "Today I learned about fractions", response.body
  end

  test "notes timeline uses correct partial for quick notes" do
    get notes_path

    assert_response :success
    assert_select "span", text: "Quick Note"
    assert_select "span", text: "📝"
  end

  test "notes timeline uses correct partial for documents" do
    get notes_path

    assert_response :success
    document = documents(:text_document)
    assert_match document.subject.name, response.body
  end

  test "notes timeline orders by date descending" do
    get notes_path

    assert_response :success
    body = response.body
    jan_27_pos = body.index("Jan 27")
    jan_26_pos = body.index("Jan 26")
    assert jan_27_pos < jan_26_pos, "Expected Jan 27 to appear before Jan 26"
  end

  test "filter by documents hides quick notes" do
    get notes_path(filter: "documents")

    assert_response :success
    assert_match "Today I learned about fractions", response.body
    assert_no_match(/Field trip to the museum/, response.body)
  end

  test "filter by quick_notes hides documents" do
    get notes_path(filter: "quick_notes")

    assert_response :success
    assert_match "Field trip to the museum", response.body
    assert_no_match(/Today I learned about fractions/, response.body)
  end

  test "filter pills show active state" do
    get notes_path(filter: "documents")

    assert_response :success
    assert_select "a.bg-coral", text: "Documents"
    assert_select "a.bg-white", text: "Quick Notes"
  end

  # Recording Lifecycle Tests

  test "creating quick note creates recording with correct date" do
    travel_to Date.new(2026, 1, 28) do
      assert_difference "Recording.count", 1 do
        post student_quick_notes_path(@student), params: {
          quick_note: {
            content: "Integration test note",
            date: "2026-01-28"
          }
        }
      end

      recording = Recording.last
      assert_equal @student, recording.student
      assert_equal Date.new(2026, 1, 28), recording.date
      assert_equal "QuickNote", recording.recordable_type
    end
  end

  test "deleting quick note removes recording" do
    quick_note = QuickNote.create!(content: "To be deleted")
    recording = Recording.create!(student: @student, date: Date.current, recordable: quick_note)

    assert_difference "Recording.count", -1 do
      assert_difference "QuickNote.count", -1 do
        delete student_quick_note_path(@student, recording)
      end
    end
  end

  test "recording appears in timeline after creation" do
    post student_quick_notes_path(@student), params: {
      quick_note: {
        content: "Brand new quick note for timeline",
        date: Date.current.to_s
      }
    }

    get notes_path
    assert_match "Brand new quick note for timeline", response.body
  end

  # Turbo Stream Integration Tests

  test "creating quick note via turbo stream updates timeline" do
    post student_quick_notes_path(@student),
         params: { quick_note: { content: "Turbo stream note", date: Date.current.to_s } },
         as: :turbo_stream

    assert_response :success
    assert_match "turbo-stream", response.body
  end

  test "deleting quick note via turbo stream removes from timeline" do
    quick_note = QuickNote.create!(content: "Turbo delete test")
    recording = Recording.create!(student: @student, date: Date.current, recordable: quick_note)

    delete student_quick_note_path(@student, recording), as: :turbo_stream

    assert_response :success
    assert_match "turbo-stream", response.body
  end

  # Empty State Tests

  test "timeline shows empty state with no recordings" do
    @student.recordings.destroy_all

    get notes_path
    assert_response :success
    assert_match "No notes yet", response.body
  end

  test "filtered timeline shows appropriate empty state" do
    @student.recordings.where(recordable_type: "Document").destroy_all

    get notes_path(filter: "documents")
    assert_response :success
    assert_match "No documents yet", response.body
  end

  # Recording Scopes via Timeline

  test "for_date scope filters recordings correctly in timeline context" do
    recordings = @student.recordings.for_date(Date.new(2026, 1, 26))
    assert recordings.any?
    recordings.each do |r|
      assert_equal Date.new(2026, 1, 26), r.date
    end
  end

  test "recent scope orders recordings correctly in timeline context" do
    recordings = @student.recordings.recent
    dates = recordings.map(&:date)
    assert_equal dates, dates.sort.reverse
  end
end
