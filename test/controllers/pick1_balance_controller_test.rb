require "test_helper"

class Pick1BalanceControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:parent)
    @student = students(:one)
    @pick1_subject = subjects(:pick1_islamic)
    @fixed_subject = subjects(:one)
    @safar = subject_options(:safar_book)
    @quran = subject_options(:quran_recitation)
    sign_in_as @user
  end

  test "shows pick1 balance card on subject show page" do
    Completion.create!(subject: @pick1_subject, date: Date.current - 1.day, subject_option: @safar)
    Completion.create!(subject: @pick1_subject, date: Date.current - 2.days, subject_option: @quran)

    get student_subject_path(@student, @pick1_subject)

    assert_response :success
    assert_match "Pick1 Balance", response.body
    assert_match "Safar Book", response.body
    assert_match "Quran Recitation", response.body
    assert_match "Seerah Stories", response.body
  end

  test "shows never-selected warning for unused options" do
    Completion.create!(subject: @pick1_subject, date: Date.current - 1.day, subject_option: @safar)

    get student_subject_path(@student, @pick1_subject)

    assert_response :success
    assert_match "Never selected in this period", response.body
  end

  test "filters by custom date range" do
    Completion.create!(subject: @pick1_subject, date: Date.new(2026, 1, 5), subject_option: @safar)
    Completion.create!(subject: @pick1_subject, date: Date.new(2026, 2, 5), subject_option: @quran)

    get student_subject_path(@student, @pick1_subject, start_date: "2026-01-01", end_date: "2026-01-31")

    assert_response :success
    assert_match "1 selection", response.body
  end

  test "defaults to last 4 weeks when no date params" do
    get student_subject_path(@student, @pick1_subject)

    assert_response :success
    assert_match "Pick1 Balance", response.body
  end

  test "does not show pick1 balance for fixed subjects" do
    get student_subject_path(@student, @fixed_subject)

    assert_response :success
    assert_no_match(/Pick1 Balance/, response.body)
  end

  test "handles invalid date params gracefully" do
    get student_subject_path(@student, @pick1_subject, start_date: "invalid", end_date: "also-invalid")

    assert_response :success
    assert_match "Pick1 Balance", response.body
  end

  test "requires authentication" do
    delete logout_path
    get student_subject_path(@student, @pick1_subject)

    assert_redirected_to login_path
  end

  test "group subject show page works for pick1" do
    group = student_groups(:family_group)
    group_teachable = teachables(:family_group_teachable)
    group_pick1 = Subject.create!(name: "Group Pick1", subject_type: "pick1", teachable: group_teachable)
    opt_a = group_pick1.subject_options.create!(name: "Option A", position: 0)
    group_pick1.subject_options.create!(name: "Option B", position: 1)
    Completion.create!(subject: group_pick1, date: Date.current - 1.day, subject_option: opt_a)

    get student_group_subject_path(group, group_pick1)

    assert_response :success
    assert_match "Pick1 Balance", response.body
    assert_match "Option A", response.body
    assert_match "Option B", response.body
  end
end
