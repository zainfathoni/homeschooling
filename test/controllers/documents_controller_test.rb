require "test_helper"

class DocumentsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:parent)
    @student = students(:one)
    @subject = subjects(:one)
    @document = documents(:text_document)
    @recording = recordings(:text_document_recording)
  end

  test "redirects when not logged in" do
    get student_documents_path(@student)
    assert_redirected_to login_path
  end

  test "shows documents index" do
    sign_in_as @user
    get student_documents_path(@student)
    assert_response :success
    assert_match @document.content, response.body
  end

  test "document card Edit link breaks out of turbo frame" do
    sign_in_as @user
    get student_documents_path(@student)
    assert_response :success
    assert_select "a[href='#{edit_student_document_path(@student, @recording)}'][data-turbo-frame='_top']", text: "Edit"
  end

  test "document card Delete link uses turbo method delete" do
    sign_in_as @user
    get student_documents_path(@student)
    assert_response :success
    assert_select "a[href='#{student_document_path(@student, @recording)}'][data-turbo-method='delete']", text: "Delete"
  end

  test "filters documents by date" do
    sign_in_as @user
    get student_documents_path(@student, date: "2026-01-26")
    assert_response :success
    assert_match "fractions", response.body
  end

  test "filters documents by subject" do
    sign_in_as @user
    get student_documents_path(@student, subject_id: @subject.id)
    assert_response :success
    assert_match "fractions", response.body
  end

  test "shows new document form" do
    sign_in_as @user
    get new_student_document_path(@student)
    assert_response :success
  end

  test "pre-fills subject_id and date from params" do
    sign_in_as @user
    get new_student_document_path(@student, subject_id: @subject.id, date: "2026-01-28")
    assert_response :success
    assert_select "select[name='document[subject_id]'] option[selected]", @subject.name
    assert_select "input[name='document[date]'][value='2026-01-28']"
  end

  test "shows selected option name when option_id provided" do
    sign_in_as @user
    option = subject_options(:safar_book)
    get new_student_document_path(@student, subject_id: option.subject.id, date: "2026-01-28", option_id: option.id)
    assert_response :success
    assert_match "Recording for:", response.body
    assert_match option.name, response.body
  end

  test "creates text document" do
    sign_in_as @user

    assert_difference "Document.count", 1 do
      post student_documents_path(@student), params: {
        document: {
          subject_id: @subject.id,
          date: "2026-01-28",
          document_type: "text",
          content: "Learned about multiplication tables."
        }
      }
    end

    new_document = Document.last
    assert_equal "Learned about multiplication tables.", new_document.content
    assert new_document.text?
    assert_redirected_to student_documents_path(@student)
  end

  test "creates document with turbo stream redirects" do
    sign_in_as @user

    assert_difference "Document.count", 1 do
      post student_documents_path(@student), params: {
        document: {
          subject_id: @subject.id,
          date: "2026-01-28",
          document_type: "text",
          content: "Learned with Turbo."
        }
      }, as: :turbo_stream
    end

    assert_redirected_to student_documents_path(@student)
  end

  test "rejects invalid document" do
    sign_in_as @user

    assert_no_difference "Document.count" do
      post student_documents_path(@student), params: {
        document: {
          subject_id: @subject.id,
          date: "2026-01-28",
          document_type: "text",
          content: ""
        }
      }
    end

    assert_response :unprocessable_entity
  end

  test "shows edit document form" do
    sign_in_as @user
    get edit_student_document_path(@student, @recording)
    assert_response :success
    assert_match @document.content, response.body
  end

  test "updates document content" do
    sign_in_as @user
    patch student_document_path(@student, @recording), params: {
      document: { content: "Updated content about fractions." }
    }
    assert_redirected_to student_documents_path(@student)
    assert_equal "Updated content about fractions.", @document.reload.content
  end

  test "updates document with turbo stream redirects" do
    sign_in_as @user
    patch student_document_path(@student, @recording), params: {
      document: { content: "Updated via Turbo." }
    }, as: :turbo_stream

    assert_redirected_to student_documents_path(@student)
    assert_equal "Updated via Turbo.", @document.reload.content
  end

  test "deletes document" do
    sign_in_as @user

    assert_difference "Recording.count", -1 do
      delete student_document_path(@student, @recording)
    end

    assert_redirected_to student_documents_path(@student)
  end

  test "deletes document with turbo stream" do
    sign_in_as @user

    assert_difference "Recording.count", -1 do
      delete student_document_path(@student, @recording), as: :turbo_stream
    end

    assert_response :success
    assert_match "turbo-stream", response.body
  end

  test "shows single document" do
    sign_in_as @user
    get student_document_path(@student, @recording)
    assert_response :success
    assert_match @document.content, response.body
  end

  test "cannot access another user's student documents" do
    other_user = User.create!(email: "other_#{SecureRandom.hex(4)}@example.com", name: "Other", password: "password123")
    sign_in_as other_user

    get student_documents_path(@student)
    assert_redirected_to students_path
  end

  test "cannot access document from another student" do
    sign_in_as @user
    other_student = students(:three)
    other_subject = other_student.all_subjects.first || Subject.create!(name: "Test", subject_type: "fixed", teachable: other_student.teachable)
    other_document = Document.create!(
      subject: other_subject,
      document_type: "text",
      content: "Other student document"
    )
    other_recording = Recording.create!(
      student: other_student,
      date: Date.current,
      recordable: other_document
    )

    get student_document_path(@student, other_recording)
    assert_redirected_to student_documents_path(@student)
  end

  test "creates voice document with audio file" do
    sign_in_as @user

    assert_difference "Document.count", 1 do
      post student_documents_path(@student), params: {
        document: {
          subject_id: @subject.id,
          date: "2026-01-28",
          document_type: "voice",
          media: fixture_file_upload("sample_audio.wav", "audio/wav")
        }
      }
    end

    new_document = Document.last
    assert new_document.voice?
    assert new_document.media.attached?
    assert_redirected_to student_documents_path(@student)
  end

  test "creates voice document with turbo stream redirects" do
    sign_in_as @user

    assert_difference "Document.count", 1 do
      post student_documents_path(@student), params: {
        document: {
          subject_id: @subject.id,
          date: "2026-01-28",
          document_type: "voice",
          media: fixture_file_upload("sample_audio.wav", "audio/wav")
        }
      }, as: :turbo_stream
    end

    assert_redirected_to student_documents_path(@student)
    assert Document.last.voice?
  end

  test "rejects voice document without audio file" do
    sign_in_as @user

    assert_no_difference "Document.count" do
      post student_documents_path(@student), params: {
        document: {
          subject_id: @subject.id,
          date: "2026-01-28",
          document_type: "voice"
        }
      }
    end

    assert_response :unprocessable_entity
  end

  test "displays voice document with audio player" do
    sign_in_as @user

    document = Document.create!(
      subject: @subject,
      document_type: "voice",
      media: fixture_file_upload("sample_audio.wav", "audio/wav")
    )
    Recording.create!(
      student: @student,
      date: Date.current,
      recordable: document
    )

    get student_documents_path(@student)
    assert_response :success
    assert_select "audio[controls]"
  end

  test "form shows type selector buttons" do
    sign_in_as @user
    get new_student_document_path(@student)
    assert_response :success
    assert_select "button[data-type='text']"
    assert_select "button[data-type='voice']"
    assert_select "button[data-type='photo']"
  end

  test "edit form shows current recording for voice document" do
    sign_in_as @user

    document = Document.create!(
      subject: @subject,
      document_type: "voice",
      media: fixture_file_upload("sample_audio.wav", "audio/wav")
    )
    recording = Recording.create!(
      student: @student,
      date: Date.current,
      recordable: document
    )

    get edit_student_document_path(@student, recording)
    assert_response :success
    assert_select "audio[controls]"
    assert_match "Current recording", response.body
  end

  test "creates photo document with image file" do
    sign_in_as @user

    assert_difference "Document.count", 1 do
      post student_documents_path(@student), params: {
        document: {
          subject_id: @subject.id,
          date: "2026-01-28",
          document_type: "photo",
          media: fixture_file_upload("sample_image.png", "image/png")
        }
      }
    end

    new_document = Document.last
    assert new_document.photo?
    assert new_document.media.attached?
    assert_redirected_to student_documents_path(@student)
  end

  test "creates photo document with turbo stream redirects" do
    sign_in_as @user

    assert_difference "Document.count", 1 do
      post student_documents_path(@student), params: {
        document: {
          subject_id: @subject.id,
          date: "2026-01-28",
          document_type: "photo",
          media: fixture_file_upload("sample_image.png", "image/png")
        }
      }, as: :turbo_stream
    end

    assert_redirected_to student_documents_path(@student)
    assert Document.last.photo?
  end

  test "rejects photo document without image file" do
    sign_in_as @user

    assert_no_difference "Document.count" do
      post student_documents_path(@student), params: {
        document: {
          subject_id: @subject.id,
          date: "2026-01-28",
          document_type: "photo"
        }
      }
    end

    assert_response :unprocessable_entity
  end

  test "displays photo document with image" do
    sign_in_as @user

    document = Document.create!(
      subject: @subject,
      document_type: "photo",
      media: fixture_file_upload("sample_image.png", "image/png")
    )
    Recording.create!(
      student: @student,
      date: Date.current,
      recordable: document
    )

    get student_documents_path(@student)
    assert_response :success
    assert_select "img[loading='lazy']"
  end

  test "edit form shows current photo for photo document" do
    sign_in_as @user

    document = Document.create!(
      subject: @subject,
      document_type: "photo",
      media: fixture_file_upload("sample_image.png", "image/png")
    )
    recording = Recording.create!(
      student: @student,
      date: Date.current,
      recordable: document
    )

    get edit_student_document_path(@student, recording)
    assert_response :success
    assert_select "img"
    assert_match "Current photo", response.body
  end
end
