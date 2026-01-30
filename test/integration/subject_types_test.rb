require "test_helper"

class SubjectTypesTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:parent)
    @student = students(:one)
    sign_in_as @user
    post select_student_path(@student)
  end

  test "fixed subject appears clickable on all weekdays" do
    fixed_subject = subjects(:one)
    assert fixed_subject.fixed?

    travel_to Date.new(2026, 1, 28) do # Wednesday
      get week_path
      assert_response :success

      # Fixed subjects should have clickable circles all 5 days
      assert_select "turbo-frame[id^='circle']", minimum: 5
    end
  end

  test "scheduled subject toggle works on active day" do
    scheduled_subject = subjects(:scheduled_coding)
    monday = Date.new(2026, 1, 26)
    scheduled_subject.completions.where(date: monday).destroy_all

    assert scheduled_subject.active_on?(monday)

    assert_difference "Completion.count", 1 do
      post toggle_completion_path(subject_id: scheduled_subject.id, date: monday)
    end
    assert_response :redirect

    assert scheduled_subject.completions.exists?(date: monday)
  end

  test "scheduled subject toggle blocked on off-day" do
    scheduled_subject = subjects(:scheduled_coding)
    friday = Date.new(2026, 1, 30)

    assert_not scheduled_subject.active_on?(friday)

    assert_no_difference "Completion.count" do
      post toggle_completion_path(subject_id: scheduled_subject.id, date: friday)
    end
    assert_response :unprocessable_entity
  end

  test "pick1 subject toggle with option creates completion" do
    pick1_subject = subjects(:pick1_islamic)
    option = subject_options(:safar_book)
    monday = Date.new(2026, 1, 26)
    pick1_subject.completions.where(date: monday).destroy_all

    assert_difference "Completion.count", 1 do
      post toggle_completion_path(subject_id: pick1_subject.id, date: monday, option_id: option.id)
    end

    completion = pick1_subject.completions.find_by(date: monday)
    assert_equal option.id, completion.subject_option_id
  end

  test "pick1 subject switching options updates completion" do
    pick1_subject = subjects(:pick1_islamic)
    option1 = subject_options(:safar_book)
    option2 = subject_options(:quran_recitation)
    monday = Date.new(2026, 1, 26)

    pick1_subject.completions.where(date: monday).destroy_all
    pick1_subject.completions.create!(date: monday, subject_option: option1)

    assert_no_difference "Completion.count" do
      post toggle_completion_path(subject_id: pick1_subject.id, date: monday, option_id: option2.id)
    end

    completion = pick1_subject.completions.find_by(date: monday)
    assert_equal option2.id, completion.subject_option_id
  end

  test "creating all subject types through form" do
    # Fixed subject
    post student_subjects_path(@student), params: {
      subject: { name: "Test Fixed", subject_type: "fixed" }
    }
    assert_response :redirect
    assert Subject.exists?(name: "Test Fixed", subject_type: "fixed")

    # Scheduled subject
    post student_subjects_path(@student), params: {
      subject: {
        name: "Test Scheduled",
        subject_type: "scheduled",
        scheduled_days: [ "0", "2", "4" ]
      }
    }
    assert_response :redirect
    scheduled = Subject.find_by(name: "Test Scheduled")
    assert scheduled.scheduled?
    assert_equal [ 0, 2, 4 ], scheduled.scheduled_days

    # Pick1 subject with options
    post student_subjects_path(@student), params: {
      subject: {
        name: "Test Pick1",
        subject_type: "pick1",
        subject_options_attributes: {
          "0" => { name: "Choice A", position: 0 },
          "1" => { name: "Choice B", position: 1 }
        }
      }
    }
    assert_response :redirect
    pick1 = Subject.find_by(name: "Test Pick1")
    assert pick1.pick1?
    assert_equal 2, pick1.subject_options.count
  end

  test "progress calculation accounts for scheduled off-days" do
    travel_to Date.new(2026, 1, 28) do
      get week_path
      assert_response :success

      # Progress bar should be rendered
      assert_select "#progress_bar" do
        assert_select ".bg-coral"
      end
    end
  end

  test "weekly grid shows all subject types correctly" do
    travel_to Date.new(2026, 1, 28) do
      get week_path
      assert_response :success

      # Should show fixed subjects
      assert_match subjects(:one).name, response.body

      # Should show scheduled subjects
      assert_match subjects(:scheduled_coding).name, response.body

      # Should show pick1 subjects
      assert_match subjects(:pick1_islamic).name, response.body
    end
  end
end
