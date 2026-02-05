require "test_helper"

class SubjectsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:parent)
    @student = students(:one)
    @subject = subjects(:one)
  end

  test "redirects when not logged in" do
    get student_subjects_path(@student)
    assert_redirected_to login_path
  end

  test "shows subjects index" do
    sign_in_as @user
    get student_subjects_path(@student)
    assert_response :success
    assert_match @subject.name, response.body
  end

  test "shows new subject form" do
    sign_in_as @user
    get new_student_subject_path(@student)
    assert_response :success
  end

  test "creates fixed subject" do
    sign_in_as @user

    assert_difference "Subject.count", 1 do
      post student_subjects_path(@student), params: {
        subject: { name: "New Fixed Subject", subject_type: "fixed" }
      }
    end

    new_subject = Subject.last
    assert_equal "New Fixed Subject", new_subject.name
    assert new_subject.fixed?
    assert_redirected_to student_subjects_path(@student)
  end

  test "creates scheduled subject with days" do
    sign_in_as @user

    assert_difference "Subject.count", 1 do
      post student_subjects_path(@student), params: {
        subject: {
          name: "New Scheduled Subject",
          subject_type: "scheduled",
          scheduled_days: [ "0", "1", "2" ]
        }
      }
    end

    new_subject = Subject.last
    assert_equal "New Scheduled Subject", new_subject.name
    assert new_subject.scheduled?
    assert_equal [ 0, 1, 2 ], new_subject.scheduled_days
    assert_redirected_to student_subjects_path(@student)
  end

  test "creates pick1 subject with options" do
    sign_in_as @user

    assert_difference "Subject.count", 1 do
      assert_difference "SubjectOption.count", 2 do
        post student_subjects_path(@student), params: {
          subject: {
            name: "New Pick1 Subject",
            subject_type: "pick1",
            subject_options_attributes: {
              "0" => { name: "Option A", position: 0 },
              "1" => { name: "Option B", position: 1 }
            }
          }
        }
      end
    end

    new_subject = Subject.last
    assert_equal "New Pick1 Subject", new_subject.name
    assert new_subject.pick1?
    assert_equal 2, new_subject.subject_options.count
    assert_equal [ "Option A", "Option B" ], new_subject.subject_options.pluck(:name)
    assert_redirected_to student_subjects_path(@student)
  end

  test "shows edit subject form" do
    sign_in_as @user
    get edit_student_subject_path(@student, @subject)
    assert_response :success
    assert_match @subject.name, response.body
  end

  test "updates subject name" do
    sign_in_as @user
    patch student_subject_path(@student, @subject), params: {
      subject: { name: "Updated Name" }
    }
    assert_redirected_to student_subjects_path(@student)
    assert_equal "Updated Name", @subject.reload.name
  end

  test "deletes subject" do
    sign_in_as @user

    assert_difference "Subject.count", -1 do
      delete student_subject_path(@student, @subject)
    end

    assert_redirected_to student_subjects_path(@student)
  end

  test "cannot access another user's student subjects" do
    other_user = User.create!(email: "other_#{SecureRandom.hex(4)}@example.com", name: "Other", password: "password123")
    sign_in_as other_user

    get student_subjects_path(@student)
    assert_redirected_to students_path
  end

  test "creates subject for group teachable via teachable_id" do
    sign_in_as @user
    group_teachable = teachables(:family_group_teachable)

    assert_difference "Subject.count", 1 do
      post student_subjects_path(@student), params: {
        teachable_id: group_teachable.id,
        subject: { name: "Group Subject", subject_type: "fixed" }
      }
    end

    new_subject = Subject.last
    assert_equal "Group Subject", new_subject.name
    assert_equal group_teachable, new_subject.teachable
    assert_redirected_to student_subjects_path(@student)
  end

  test "cannot create subject for another user's teachable" do
    sign_in_as @user
    other_teachable = teachables(:student_two_teachable)

    post student_subjects_path(@student), params: {
      teachable_id: other_teachable.id,
      subject: { name: "Unauthorized Subject", subject_type: "fixed" }
    }

    assert_redirected_to student_subjects_path(@student)
    assert_equal "Teachable not found", flash[:alert]
  end

  test "shows index with group subjects" do
    sign_in_as @user
    group_teachable = teachables(:family_group_teachable)
    group_subject = Subject.create!(name: "Family Art", subject_type: "fixed", teachable: group_teachable)

    get student_subjects_path(@student)

    assert_response :success
    assert_match "Family Art", response.body
  end
end
