# frozen_string_literal: true

module WeekHelper
  def week_dates(date = Date.current)
    start = date.beginning_of_week(:monday)
    (start..(start + 4.days)).to_a
  end

  def week_label(start_date, end_date)
    if start_date.month == end_date.month
      "#{start_date.strftime('%b %d')} - #{end_date.day}"
    else
      "#{start_date.strftime('%b %d')} - #{end_date.strftime('%b %d')}"
    end
  end
end
