# frozen_string_literal: true

module StudentsHelper
  def completion_percentage(stats)
    return 0 if stats[:total].to_i <= 0

    (stats[:completed].to_f / stats[:total] * 100).round
  end

  def subject_type_badge_class(subject_type)
    case subject_type
    when "fixed"
      "bg-blue-50 text-blue-600"
    when "scheduled"
      "bg-green-50 text-green-600"
    else
      "bg-purple-50 text-purple-600"
    end
  end
end
