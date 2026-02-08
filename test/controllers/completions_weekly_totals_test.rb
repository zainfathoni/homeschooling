require "test_helper"

class CompletionsWeeklyTotalsTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:parent)
    @student = students(:one)
    @monday = Date.new(2026, 1, 26) # A Monday

    # Clear all completions for clean tests (delete_all is faster than destroy_all)
    Completion.delete_all

    sign_in_as @user
  end

  test "toggle creates completion for personal subject" do
    personal_subject = subjects(:one) # Math - belongs to student one
    assert personal_subject.active_on?(@monday)

    # Toggle completion via Turbo Stream
    post toggle_completion_path(subject_id: personal_subject.id, date: @monday),
      headers: { "Accept" => "text/vnd.turbo-stream.html" }

    assert_response :success
    # Verify the completion was created
    assert personal_subject.completions.exists?(date: @monday)
  end

  test "group subjects visible in student all_subjects" do
    group_subject = subjects(:family_science)
    assert group_subject.active_on?(@monday)

    # Student one is in family_group (via group_memberships fixture)
    assert @student.student_groups.include?(group_subject.teachable.student_group)

    # Verify student can see group subject in all_subjects
    assert @student.all_subjects.include?(group_subject)
  end

  test "student all_subjects includes both personal and group subjects" do
    personal_subject = subjects(:one) # Math - personal
    group_subject = subjects(:family_science) # Group subject

    all_subjects = @student.all_subjects

    # Should include personal subjects
    assert all_subjects.include?(personal_subject),
      "Expected personal subject #{personal_subject.name} in all_subjects"

    # Should include group subjects
    assert all_subjects.include?(group_subject),
      "Expected group subject #{group_subject.name} in all_subjects"
  end

  test "weekly totals response includes completions for subject teachable" do
    personal_subject = subjects(:one) # Math
    group_subject = subjects(:family_science)

    # Create completions for both
    personal_subject.completions.create!(date: @monday, completed: true)
    group_subject.completions.create!(date: @monday, completed: true)

    # Toggle another subject to trigger week_totals calculation
    scheduled_subject = subjects(:scheduled_coding)
    post toggle_completion_path(subject_id: scheduled_subject.id, date: @monday),
      headers: { "Accept" => "text/vnd.turbo-stream.html" }

    assert_response :success

    # Verify the Turbo Stream response includes the progress_bar and progress_ring targets
    assert_match(/progress_bar/, @response.body, "Response should include progress_bar update")
    assert_match(/progress_ring/, @response.body, "Response should include progress_ring update")

    # The progress ring shows task count in a X/Y format
    assert_match(%r{<span class="text-xl font-bold text-gray-800">\d+/\d+</span>}, @response.body,
      "Response should show completion count in progress ring")
  end
end
