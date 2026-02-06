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

  test "rejects invalid quick note" do
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

  test "shows edit quick note form" do
    sign_in_as @user
    get edit_student_quick_note_path(@student, @recording)
    assert_response :success
    assert_match @quick_note.content, response.body
  end

  test "updates quick note content" do
    sign_in_as @user
    patch student_quick_note_path(@student, @recording), params: {
      quick_note: { content: "Updated: Museum trip was amazing" }
    }
    assert_redirected_to student_quick_notes_path(@student)
    assert_equal "Updated: Museum trip was amazing", @quick_note.reload.content
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
