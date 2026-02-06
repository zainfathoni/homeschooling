# frozen_string_literal: true

module StudentsHelper
  def completion_percentage(stats)
    return 0 if stats[:total].to_i <= 0

    (stats[:completed].to_f / stats[:total] * 100).round
  end
end
