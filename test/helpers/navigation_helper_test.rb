require "test_helper"

class NavigationHelperTest < ActionView::TestCase
  include NavigationHelper

  test "nav_active? returns true for current page" do
    @request = ActionDispatch::TestRequest.create
    @request.path = "/today"

    assert nav_active?("/today")
  end

  test "nav_active? returns false for different page" do
    @request = ActionDispatch::TestRequest.create
    @request.path = "/today"

    assert_not nav_active?("/week")
  end

  test "nav_link_classes includes base_classes" do
    @request = ActionDispatch::TestRequest.create
    @request.path = "/today"

    result = nav_link_classes("/today", base_classes: "flex items-center")
    assert_includes result, "flex items-center"
  end
end
