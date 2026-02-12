require "test_helper"

class CompletionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:parent)
    @subject = subjects(:one)
    @date = Date.new(2026, 1, 28)  # Wednesday - subjects are active on weekdays
  end

  test "redirects when not logged in" do
    post toggle_completion_path(subject_id: @subject.id, date: @date)
    assert_redirected_to login_path
  end

  test "creates completion when toggling uncompleted subject" do
    sign_in_as @user
    @subject.completions.where(date: @date).destroy_all

    assert_difference "Completion.count", 1 do
      post toggle_completion_path(subject_id: @subject.id, date: @date)
    end
    assert_response :redirect
    assert @subject.completions.exists?(date: @date)
  end

  test "destroys completion when toggling completed subject" do
    sign_in_as @user
    @subject.completions.where(date: @date).destroy_all
    @subject.completions.create!(date: @date, completed: true)

    assert_difference "Completion.count", -1 do
      post toggle_completion_path(subject_id: @subject.id, date: @date)
    end
    assert_response :redirect
    assert_not @subject.completions.exists?(date: @date)
  end

  test "responds with turbo stream" do
    sign_in_as @user
    @subject.completions.where(date: @date).destroy_all

    post toggle_completion_path(subject_id: @subject.id, date: @date),
      headers: { "Accept" => "text/vnd.turbo-stream.html" }
    assert_response :success
    assert_match "turbo-stream", response.body
  end

  test "blocks toggle for scheduled subject on off-day" do
    sign_in_as @user
    scheduled_subject = subjects(:scheduled_coding)
    # Friday is day index 4, not in scheduled_days [0,1,2,3]
    friday = Date.new(2026, 1, 30) # A Friday

    assert_not scheduled_subject.active_on?(friday)

    assert_no_difference "Completion.count" do
      post toggle_completion_path(subject_id: scheduled_subject.id, date: friday)
    end
    assert_response :unprocessable_entity
  end

  test "allows toggle for scheduled subject on active day" do
    sign_in_as @user
    scheduled_subject = subjects(:scheduled_coding)
    # Monday is day index 0, in scheduled_days [0,1,2,3]
    monday = Date.new(2026, 1, 26) # A Monday
    scheduled_subject.completions.where(date: monday).destroy_all

    assert scheduled_subject.active_on?(monday)

    assert_difference "Completion.count", 1 do
      post toggle_completion_path(subject_id: scheduled_subject.id, date: monday)
    end
    assert_response :redirect
  end

  test "blocks toggle for any subject on weekend" do
    sign_in_as @user
    saturday = Date.new(2026, 1, 31) # A Saturday

    assert_not @subject.active_on?(saturday)

    assert_no_difference "Completion.count" do
      post toggle_completion_path(subject_id: @subject.id, date: saturday)
    end
    assert_response :unprocessable_entity
  end

  test "pick1 subject creates completion with selected option" do
    sign_in_as @user
    pick1_subject = subjects(:pick1_islamic)
    option = subject_options(:safar_book)
    monday = Date.new(2026, 1, 26)
    pick1_subject.completions.where(date: monday).destroy_all

    assert_difference "Completion.count", 1 do
      post toggle_completion_path(subject_id: pick1_subject.id, date: monday, option_id: option.id)
    end
    assert_response :redirect

    completion = pick1_subject.completions.find_by(date: monday)
    assert_equal option.id, completion.subject_option_id
  end

  test "pick1 subject clicking same option uncompletes" do
    sign_in_as @user
    pick1_subject = subjects(:pick1_islamic)
    option = subject_options(:safar_book)
    monday = Date.new(2026, 1, 26)
    pick1_subject.completions.where(date: monday).destroy_all
    pick1_subject.completions.create!(date: monday, subject_option: option, completed: true)

    assert_difference "Completion.count", -1 do
      post toggle_completion_path(subject_id: pick1_subject.id, date: monday, option_id: option.id)
    end
    assert_response :redirect
    assert_not pick1_subject.completions.exists?(date: monday)
  end

  test "pick1 subject clicking different option switches selection" do
    sign_in_as @user
    pick1_subject = subjects(:pick1_islamic)
    option1 = subject_options(:safar_book)
    option2 = subject_options(:quran_recitation)
    monday = Date.new(2026, 1, 26)
    pick1_subject.completions.where(date: monday).destroy_all
    pick1_subject.completions.create!(date: monday, subject_option: option1, completed: true)

    assert_no_difference "Completion.count" do
      post toggle_completion_path(subject_id: pick1_subject.id, date: monday, option_id: option2.id)
    end
    assert_response :redirect

    completion = pick1_subject.completions.find_by(date: monday)
    assert_equal option2.id, completion.subject_option_id
  end

  test "shows narration reminder when completing subject with narration_required and no narration" do
    sign_in_as @user
    narration_subject = subjects(:narration_required_subject)
    monday = Date.new(2026, 1, 26)
    narration_subject.completions.where(date: monday).destroy_all
    narration_subject.documents.for_date(monday).destroy_all

    post toggle_completion_path(subject_id: narration_subject.id, date: monday),
      headers: { "Accept" => "text/vnd.turbo-stream.html" }

    assert_response :success
    assert_match "document-reminder-modal", response.body
    assert_match "Add Document", response.body
    assert_match "Skip for Now", response.body
  end

  test "does not show narration reminder when completing subject with narration_required but has narration" do
    sign_in_as @user
    narration_subject = subjects(:narration_required_subject)
    monday = Date.new(2026, 1, 26)
    narration_subject.completions.where(date: monday).destroy_all
    document = Document.create!(
      subject: narration_subject,
      document_type: "text",
      content: "Test document"
    )
    Recording.create!(
      student: narration_subject.owner_student,
      date: monday,
      recordable: document
    )

    post toggle_completion_path(subject_id: narration_subject.id, date: monday),
      headers: { "Accept" => "text/vnd.turbo-stream.html" }

    assert_response :success
    assert_no_match(/document-reminder-modal/, response.body)
  end

  test "does not show narration reminder when completing subject without narration_required" do
    sign_in_as @user
    @subject.completions.where(date: @date).destroy_all

    post toggle_completion_path(subject_id: @subject.id, date: @date),
      headers: { "Accept" => "text/vnd.turbo-stream.html" }

    assert_response :success
    assert_no_match(/document-reminder-modal/, response.body)
  end

  test "does not show narration reminder when uncompleting subject" do
    sign_in_as @user
    narration_subject = subjects(:narration_required_subject)
    monday = Date.new(2026, 1, 26)
    narration_subject.completions.where(date: monday).destroy_all
    narration_subject.completions.create!(date: monday, completed: true)

    post toggle_completion_path(subject_id: narration_subject.id, date: monday),
      headers: { "Accept" => "text/vnd.turbo-stream.html" }

    assert_response :success
    assert_no_match(/document-reminder-modal/, response.body)
  end
end
