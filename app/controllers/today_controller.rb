class TodayController < ApplicationController
  include WeekHelper

  def index
    @students = Current.user.students
    @student = current_student
    @date = Date.current
    @week_start = @date.beginning_of_week(:monday)
    @week_end = @week_start + 4.days
    @dates = week_dates(@date)

    if @student
      @subjects = @student.subjects.includes(:completions)
      @week_completions = Completion.joins(:subject)
                                    .where(subjects: { student_id: @student.id })
                                    .where(date: @week_start..@week_end)
                                    .pluck(:subject_id, :date)
                                    .group_by(&:first)
                                    .transform_values { |v| v.map(&:last).to_set }
    else
      @subjects = []
      @week_completions = {}
    end

    @total_possible = @subjects.count * @dates.count
    @total_completed = @week_completions.values.sum(&:size)
  end
end
