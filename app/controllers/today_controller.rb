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
      @week_narrations = Narration.where(student_id: @student.id)
                                  .where(date: @week_start..@week_end)
                                  .pluck(:subject_id, :date)
                                  .group_by(&:first)
                                  .transform_values { |v| v.map(&:last).to_set }
    else
      @subjects = []
      @week_completions = {}
      @week_narrations = {}
    end

    @total_possible = calculate_week_possible(@subjects, @dates)
    @total_completed = @week_completions.values.sum(&:size)

    # For Duet view: load daily focus data for current day (only active subjects)
    if @student
      @daily_subjects = @subjects.select { |s| s.active_on?(@date) }
      daily_completions_records = Completion.where(subject: @daily_subjects, date: @date)
      @daily_completions = daily_completions_records.pluck(:subject_id).to_set
      @pick1_selections = daily_completions_records.where.not(subject_option_id: nil)
                                                   .pluck(:subject_id, :subject_option_id)
                                                   .to_h
    end
  end
end
