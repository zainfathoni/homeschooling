require "test_helper"

class NarrationsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:parent)
    @student = students(:one)
    @subject = subjects(:one)
    @narration = narrations(:text_narration)
    @recording = recordings(:text_narration_recording)
  end

  test "redirects when not logged in" do
    get student_narrations_path(@student)
    assert_redirected_to login_path
  end

  test "shows narrations index" do
    sign_in_as @user
    get student_narrations_path(@student)
    assert_response :success
    assert_match @narration.content, response.body
  end

  test "narration card Edit link breaks out of turbo frame" do
    sign_in_as @user
    get student_narrations_path(@student)
    assert_response :success
    assert_select "a[href='#{edit_student_narration_path(@student, @recording)}'][data-turbo-frame='_top']", text: "Edit"
  end

  test "narration card Delete link uses turbo method delete" do
    sign_in_as @user
    get student_narrations_path(@student)
    assert_response :success
    assert_select "a[href='#{student_narration_path(@student, @narration)}'][data-turbo-method='delete']", text: "Delete"
  end

  test "filters narrations by date" do
    sign_in_as @user
    get student_narrations_path(@student, date: "2026-01-26")
    assert_response :success
    assert_match "fractions", response.body
  end

  test "filters narrations by subject" do
    sign_in_as @user
    get student_narrations_path(@student, subject_id: @subject.id)
    assert_response :success
    assert_match "fractions", response.body
  end

  test "shows new narration form" do
    sign_in_as @user
    get new_student_narration_path(@student)
    assert_response :success
  end

  test "pre-fills subject_id and date from params" do
    sign_in_as @user
    get new_student_narration_path(@student, subject_id: @subject.id, date: "2026-01-28")
    assert_response :success
    assert_select "select[name='narration[subject_id]'] option[selected]", @subject.name
    assert_select "input[name='narration[date]'][value='2026-01-28']"
  end

  test "shows selected option name when option_id provided" do
    sign_in_as @user
    option = subject_options(:safar_book)
    get new_student_narration_path(@student, subject_id: option.subject.id, date: "2026-01-28", option_id: option.id)
    assert_response :success
    assert_match "Recording for:", response.body
    assert_match option.name, response.body
  end

  test "creates text narration" do
    sign_in_as @user

    assert_difference "Narration.count", 1 do
      post student_narrations_path(@student), params: {
        narration: {
          subject_id: @subject.id,
          date: "2026-01-28",
          narration_type: "text",
          content: "Learned about multiplication tables."
        }
      }
    end

    new_narration = Narration.last
    assert_equal "Learned about multiplication tables.", new_narration.content
    assert new_narration.text?
    assert_redirected_to student_narrations_path(@student)
  end

  test "creates narration with turbo stream redirects" do
    sign_in_as @user

    assert_difference "Narration.count", 1 do
      post student_narrations_path(@student), params: {
        narration: {
          subject_id: @subject.id,
          date: "2026-01-28",
          narration_type: "text",
          content: "Learned with Turbo."
        }
      }, as: :turbo_stream
    end

    assert_redirected_to student_narrations_path(@student)
  end

  test "rejects invalid narration" do
    sign_in_as @user

    assert_no_difference "Narration.count" do
      post student_narrations_path(@student), params: {
        narration: {
          subject_id: @subject.id,
          date: "2026-01-28",
          narration_type: "text",
          content: ""
        }
      }
    end

    assert_response :unprocessable_entity
  end

  test "shows edit narration form" do
    sign_in_as @user
    get edit_student_narration_path(@student, @narration)
    assert_response :success
    assert_match @narration.content, response.body
  end

  test "updates narration content" do
    sign_in_as @user
    patch student_narration_path(@student, @narration), params: {
      narration: { content: "Updated content about fractions." }
    }
    assert_redirected_to student_narrations_path(@student)
    assert_equal "Updated content about fractions.", @narration.reload.content
  end

  test "updates narration with turbo stream redirects" do
    sign_in_as @user
    patch student_narration_path(@student, @narration), params: {
      narration: { content: "Updated via Turbo." }
    }, as: :turbo_stream

    assert_redirected_to student_narrations_path(@student)
    assert_equal "Updated via Turbo.", @narration.reload.content
  end

  test "deletes narration" do
    sign_in_as @user

    assert_difference "Recording.count", -1 do
      delete student_narration_path(@student, @recording)
    end

    assert_redirected_to student_narrations_path(@student)
  end

  test "deletes narration with turbo stream" do
    sign_in_as @user

    assert_difference "Recording.count", -1 do
      delete student_narration_path(@student, @recording), as: :turbo_stream
    end

    assert_response :success
    assert_match "turbo-stream", response.body
  end

  test "shows single narration" do
    sign_in_as @user
    get student_narration_path(@student, @narration)
    assert_response :success
    assert_match @narration.content, response.body
  end

  test "cannot access another user's student narrations" do
    other_user = User.create!(email: "other_#{SecureRandom.hex(4)}@example.com", name: "Other", password: "password123")
    sign_in_as other_user

    get student_narrations_path(@student)
    assert_redirected_to students_path
  end

  test "cannot access narration from another student" do
    sign_in_as @user
    other_student = students(:three)
    other_narration = Narration.create!(
      student: other_student,
      subject: other_student.all_subjects.first || Subject.create!(name: "Test", subject_type: "fixed", teachable: other_student.teachable),
      date: Date.current,
      narration_type: "text",
      content: "Other student narration"
    )

    get student_narration_path(@student, other_narration)
    assert_redirected_to student_narrations_path(@student)
  end

  test "creates voice narration with audio file" do
    sign_in_as @user

    assert_difference "Narration.count", 1 do
      post student_narrations_path(@student), params: {
        narration: {
          subject_id: @subject.id,
          date: "2026-01-28",
          narration_type: "voice",
          media: fixture_file_upload("sample_audio.wav", "audio/wav")
        }
      }
    end

    new_narration = Narration.last
    assert new_narration.voice?
    assert new_narration.media.attached?
    assert_redirected_to student_narrations_path(@student)
  end

  test "creates voice narration with turbo stream redirects" do
    sign_in_as @user

    assert_difference "Narration.count", 1 do
      post student_narrations_path(@student), params: {
        narration: {
          subject_id: @subject.id,
          date: "2026-01-28",
          narration_type: "voice",
          media: fixture_file_upload("sample_audio.wav", "audio/wav")
        }
      }, as: :turbo_stream
    end

    assert_redirected_to student_narrations_path(@student)
    assert Narration.last.voice?
  end

  test "rejects voice narration without audio file" do
    sign_in_as @user

    assert_no_difference "Narration.count" do
      post student_narrations_path(@student), params: {
        narration: {
          subject_id: @subject.id,
          date: "2026-01-28",
          narration_type: "voice"
        }
      }
    end

    assert_response :unprocessable_entity
  end

  test "displays voice narration with audio player" do
    sign_in_as @user

    narration = Narration.create!(
      subject: @subject,
      narration_type: "voice",
      media: fixture_file_upload("sample_audio.wav", "audio/wav")
    )
    Recording.create!(
      student: @student,
      date: Date.current,
      recordable: narration
    )

    get student_narrations_path(@student)
    assert_response :success
    assert_select "audio[controls]"
  end

  test "form shows type selector buttons" do
    sign_in_as @user
    get new_student_narration_path(@student)
    assert_response :success
    assert_select "button[data-type='text']"
    assert_select "button[data-type='voice']"
    assert_select "button[data-type='photo']"
  end

  test "edit form shows current recording for voice narration" do
    sign_in_as @user

    narration = Narration.create!(
      subject: @subject,
      narration_type: "voice",
      media: fixture_file_upload("sample_audio.wav", "audio/wav")
    )
    recording = Recording.create!(
      student: @student,
      date: Date.current,
      recordable: narration
    )

    get edit_student_narration_path(@student, recording)
    assert_response :success
    assert_select "audio[controls]"
    assert_match "Current recording", response.body
  end

  test "creates photo narration with image file" do
    sign_in_as @user

    assert_difference "Narration.count", 1 do
      post student_narrations_path(@student), params: {
        narration: {
          subject_id: @subject.id,
          date: "2026-01-28",
          narration_type: "photo",
          media: fixture_file_upload("sample_image.png", "image/png")
        }
      }
    end

    new_narration = Narration.last
    assert new_narration.photo?
    assert new_narration.media.attached?
    assert_redirected_to student_narrations_path(@student)
  end

  test "creates photo narration with turbo stream redirects" do
    sign_in_as @user

    assert_difference "Narration.count", 1 do
      post student_narrations_path(@student), params: {
        narration: {
          subject_id: @subject.id,
          date: "2026-01-28",
          narration_type: "photo",
          media: fixture_file_upload("sample_image.png", "image/png")
        }
      }, as: :turbo_stream
    end

    assert_redirected_to student_narrations_path(@student)
    assert Narration.last.photo?
  end

  test "rejects photo narration without image file" do
    sign_in_as @user

    assert_no_difference "Narration.count" do
      post student_narrations_path(@student), params: {
        narration: {
          subject_id: @subject.id,
          date: "2026-01-28",
          narration_type: "photo"
        }
      }
    end

    assert_response :unprocessable_entity
  end

  test "displays photo narration with image" do
    sign_in_as @user

    narration = Narration.create!(
      subject: @subject,
      narration_type: "photo",
      media: fixture_file_upload("sample_image.png", "image/png")
    )
    Recording.create!(
      student: @student,
      date: Date.current,
      recordable: narration
    )

    get student_narrations_path(@student)
    assert_response :success
    assert_select "img[loading='lazy']"
  end

  test "edit form shows current photo for photo narration" do
    sign_in_as @user

    narration = Narration.create!(
      subject: @subject,
      narration_type: "photo",
      media: fixture_file_upload("sample_image.png", "image/png")
    )
    recording = Recording.create!(
      student: @student,
      date: Date.current,
      recordable: narration
    )

    get edit_student_narration_path(@student, recording)
    assert_response :success
    assert_select "img"
    assert_match "Current photo", response.body
  end
end
