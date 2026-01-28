require "test_helper"

class CompletionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:parent)
    @subject = subjects(:one)
    @date = Date.current
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
end
