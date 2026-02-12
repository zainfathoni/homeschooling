require "test_helper"

class QuickNotesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:parent)
    @student = students(:one)
    @quick_note = quick_notes(:field_trip)
    @recording = recordings(:quick_note_recording)
  end

  test "redirects when not logged in" do
    get student_quick_notes_path(@student)
    assert_redirected_to login_path
  end

  test "shows quick notes index" do
    sign_in_as @user
    get student_quick_notes_path(@student)
    assert_response :success
    assert_match @quick_note.content, response.body
  end

  test "filters quick notes by date" do
    sign_in_as @user
    get student_quick_notes_path(@student, date: "2026-01-26")
    assert_response :success
    assert_match "Field trip", response.body
  end

  test "shows new quick note form" do
    sign_in_as @user
    get new_student_quick_note_path(@student)
    assert_response :success
  end

  test "pre-fills date from params" do
    sign_in_as @user
    get new_student_quick_note_path(@student, date: "2026-01-28")
    assert_response :success
    assert_select "input[name='quick_note[date]'][value='2026-01-28']"
  end

  test "new form includes audio file field" do
    sign_in_as @user
    get new_student_quick_note_path(@student)
    assert_response :success
    assert_select "input[type='file'][accept='audio/*']"
  end

  test "creates quick note" do
    sign_in_as @user

    assert_difference "QuickNote.count", 1 do
      post student_quick_notes_path(@student), params: {
        quick_note: {
          content: "Feeling under the weather today - light schoolwork",
          date: "2026-01-28"
        }
      }
    end

    new_note = QuickNote.last
    assert_equal "Feeling under the weather today - light schoolwork", new_note.content
    assert_not new_note.audio.attached?
    assert_redirected_to student_quick_notes_path(@student)
  end

  test "creates quick note with turbo stream redirects" do
    sign_in_as @user

    assert_difference "QuickNote.count", 1 do
      post student_quick_notes_path(@student), params: {
        quick_note: {
          content: "Turbo note",
          date: "2026-01-28"
        }
      }, as: :turbo_stream
    end

    assert_response :success
    assert_match "turbo-stream", response.body
  end

  test "rejects quick note without content or audio" do
    sign_in_as @user

    assert_no_difference "QuickNote.count" do
      post student_quick_notes_path(@student), params: {
        quick_note: {
          content: "",
          date: "2026-01-28"
        }
      }
    end

    assert_response :unprocessable_entity
  end

  test "creates quick note with audio only" do
    sign_in_as @user

    assert_difference "QuickNote.count", 1 do
      post student_quick_notes_path(@student), params: {
        quick_note: {
          content: "",
          date: "2026-01-28",
          audio: fixture_file_upload("sample_audio.wav", "audio/wav")
        }
      }
    end

    new_note = QuickNote.last
    assert new_note.audio.attached?
    assert_match %r{\Aaudio/}, new_note.audio.content_type
    assert new_note.content.blank?
    assert_redirected_to student_quick_notes_path(@student)
  end

  test "creates quick note with both text and audio" do
    sign_in_as @user

    assert_difference "QuickNote.count", 1 do
      post student_quick_notes_path(@student), params: {
        quick_note: {
          content: "Voice memo about today's lesson",
          date: "2026-01-28",
          audio: fixture_file_upload("sample_audio.wav", "audio/wav")
        }
      }
    end

    new_note = QuickNote.last
    assert_equal "Voice memo about today's lesson", new_note.content
    assert new_note.audio.attached?
    assert_redirected_to student_quick_notes_path(@student)
  end

  test "creates voice quick note with turbo stream" do
    sign_in_as @user

    assert_difference "QuickNote.count", 1 do
      post student_quick_notes_path(@student), params: {
        quick_note: {
          content: "",
          date: "2026-01-28",
          audio: fixture_file_upload("sample_audio.wav", "audio/wav")
        }
      }, as: :turbo_stream
    end

    assert_response :success
    assert_match "turbo-stream", response.body
    assert QuickNote.last.audio.attached?
  end

  test "rejects non-audio file upload" do
    sign_in_as @user

    assert_no_difference "QuickNote.count" do
      post student_quick_notes_path(@student), params: {
        quick_note: {
          content: "",
          date: "2026-01-28",
          audio: fixture_file_upload("sample_image.png", "image/png")
        }
      }
    end

    assert_response :unprocessable_entity
  end

  test "shows edit quick note form" do
    sign_in_as @user
    get edit_student_quick_note_path(@student, @recording)
    assert_response :success
    assert_match @quick_note.content, response.body
  end

  test "edit form includes audio file field" do
    sign_in_as @user
    get edit_student_quick_note_path(@student, @recording)
    assert_response :success
    assert_select "input[type='file'][accept='audio/*']"
  end

  test "updates quick note content" do
    sign_in_as @user
    patch student_quick_note_path(@student, @recording), params: {
      quick_note: { content: "Updated: Museum trip was amazing" }
    }
    assert_redirected_to student_quick_notes_path(@student)
    assert_equal "Updated: Museum trip was amazing", @quick_note.reload.content
  end

  test "updates quick note with audio attachment" do
    sign_in_as @user
    patch student_quick_note_path(@student, @recording), params: {
      quick_note: {
        content: @quick_note.content,
        audio: fixture_file_upload("sample_audio.wav", "audio/wav")
      }
    }
    assert_redirected_to student_quick_notes_path(@student)
    assert @quick_note.reload.audio.attached?
  end

  test "updates quick note date" do
    sign_in_as @user
    patch student_quick_note_path(@student, @recording), params: {
      quick_note: {
        content: @quick_note.content,
        date: "2026-01-27"
      }
    }
    assert_redirected_to student_quick_notes_path(@student)
    assert_equal Date.new(2026, 1, 27), @recording.reload.date
  end

  test "updates quick note with turbo stream redirects" do
    sign_in_as @user
    patch student_quick_note_path(@student, @recording), params: {
      quick_note: { content: "Updated via Turbo" }
    }, as: :turbo_stream

    assert_response :success
    assert_match "turbo-stream", response.body
    assert_equal "Updated via Turbo", @quick_note.reload.content
  end

  test "displays audio player for voice quick note" do
    sign_in_as @user

    @quick_note.audio.attach(
      io: StringIO.new("fake audio data"),
      filename: "note.wav",
      content_type: "audio/wav"
    )
    @quick_note.save!

    get student_quick_note_path(@student, @recording)
    assert_response :success
    assert_select "audio[controls]"
  end

  test "deletes quick note" do
    sign_in_as @user

    assert_difference "Recording.count", -1 do
      delete student_quick_note_path(@student, @recording)
    end

    assert_redirected_to student_quick_notes_path(@student)
  end

  test "deletes quick note with turbo stream" do
    sign_in_as @user

    assert_difference "Recording.count", -1 do
      delete student_quick_note_path(@student, @recording), as: :turbo_stream
    end

    assert_response :success
    assert_match "turbo-stream", response.body
  end

  test "shows single quick note" do
    sign_in_as @user
    get student_quick_note_path(@student, @recording)
    assert_response :success
    assert_match @quick_note.content, response.body
  end

  test "cannot access another user's student quick notes" do
    other_user = User.create!(email: "other_#{SecureRandom.hex(4)}@example.com", name: "Other", password: "password123")
    sign_in_as other_user

    get student_quick_notes_path(@student)
    assert_redirected_to students_path
  end

  test "cannot access quick note from another student" do
    sign_in_as @user
    other_student = students(:three)
    other_note = QuickNote.create!(content: "Other student note")
    other_recording = Recording.create!(
      student: other_student,
      date: Date.current,
      recordable: other_note
    )

    get student_quick_note_path(@student, other_recording)
    assert_redirected_to student_quick_notes_path(@student)
  end
end
