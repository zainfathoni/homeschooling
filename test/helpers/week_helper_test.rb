# frozen_string_literal: true

require "test_helper"

class WeekHelperTest < ActionView::TestCase
  include WeekHelper

  # week_dates tests

  test "week_dates returns Mon-Fri array for a Wednesday" do
    wednesday = Date.new(2026, 1, 28) # Wednesday
    dates = week_dates(wednesday)

    assert_equal 5, dates.length
    assert_equal Date.new(2026, 1, 26), dates.first # Monday
    assert_equal Date.new(2026, 1, 30), dates.last  # Friday
  end

  test "week_dates returns same week when called with Monday" do
    monday = Date.new(2026, 1, 26)
    dates = week_dates(monday)

    assert_equal monday, dates.first
    assert_equal Date.new(2026, 1, 30), dates.last
  end

  test "week_dates returns same week when called with Friday" do
    friday = Date.new(2026, 1, 30)
    dates = week_dates(friday)

    assert_equal Date.new(2026, 1, 26), dates.first
    assert_equal friday, dates.last
  end

  test "week_dates handles Saturday by returning previous week" do
    saturday = Date.new(2026, 1, 31)
    dates = week_dates(saturday)

    assert_equal Date.new(2026, 1, 26), dates.first # Previous Monday
    assert_equal Date.new(2026, 1, 30), dates.last  # Previous Friday
  end

  test "week_dates handles Sunday by returning current week" do
    sunday = Date.new(2026, 2, 1)
    dates = week_dates(sunday)

    assert_equal Date.new(2026, 1, 26), dates.first # Monday of that week
    assert_equal Date.new(2026, 1, 30), dates.last
  end

  test "week_dates handles week spanning year boundary" do
    new_year = Date.new(2026, 1, 1) # Thursday
    dates = week_dates(new_year)

    assert_equal Date.new(2025, 12, 29), dates.first # Monday in 2025
    assert_equal Date.new(2026, 1, 2), dates.last    # Friday in 2026
  end

  test "week_dates defaults to current date when no argument" do
    travel_to Date.new(2026, 1, 28) do
      dates = week_dates

      assert_equal Date.new(2026, 1, 26), dates.first
      assert_equal Date.new(2026, 1, 30), dates.last
    end
  end

  # week_label tests

  test "week_label formats same-month week" do
    start_date = Date.new(2026, 1, 26)
    end_date = Date.new(2026, 1, 30)

    assert_equal "Jan 26 - 30", week_label(start_date, end_date)
  end

  test "week_label formats cross-month week" do
    start_date = Date.new(2026, 1, 27)
    end_date = Date.new(2026, 2, 1)

    assert_equal "Jan 27 - Feb 01", week_label(start_date, end_date)
  end

  test "week_label formats cross-year week" do
    start_date = Date.new(2025, 12, 29)
    end_date = Date.new(2026, 1, 2)

    assert_equal "Dec 29 - Jan 02", week_label(start_date, end_date)
  end

  test "week_label handles single-digit days with leading zero" do
    start_date = Date.new(2026, 3, 2)
    end_date = Date.new(2026, 3, 6)

    assert_equal "Mar 02 - 6", week_label(start_date, end_date)
  end

  # calculate_week_possible tests

  test "calculate_week_possible counts fixed subjects for all days" do
    fixed_subject = subjects(:one)
    assert fixed_subject.fixed?

    dates = week_dates(Date.new(2026, 1, 28))
    possible = calculate_week_possible([ fixed_subject ], dates)

    assert_equal 5, possible
  end

  test "calculate_week_possible counts scheduled subjects only for active days" do
    scheduled_subject = subjects(:scheduled_coding)
    assert scheduled_subject.scheduled?
    assert_equal [ 0, 1, 2, 3 ], scheduled_subject.scheduled_days

    dates = week_dates(Date.new(2026, 1, 28))
    possible = calculate_week_possible([ scheduled_subject ], dates)

    assert_equal 4, possible
  end

  test "calculate_week_possible handles mixed subject types" do
    fixed_subject = subjects(:one)
    scheduled_subject = subjects(:scheduled_coding)
    pick1_subject = subjects(:pick1_islamic)

    dates = week_dates(Date.new(2026, 1, 28))
    possible = calculate_week_possible([ fixed_subject, scheduled_subject, pick1_subject ], dates)

    # fixed: 5 days, scheduled: 4 days, pick1: 5 days = 14
    assert_equal 14, possible
  end

  test "calculate_week_possible returns 0 for empty subjects" do
    dates = week_dates(Date.new(2026, 1, 28))
    possible = calculate_week_possible([], dates)

    assert_equal 0, possible
  end
end
