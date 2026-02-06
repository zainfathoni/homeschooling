class TodayController < ApplicationController
  include WeekHelper

  def index
    @students = Current.user.students
    @student = current_student
    @date = clamp_to_weekday(Date.current)
    @week_start = @date.beginning_of_week(:monday)
    @week_end = @week_start + 4.days
    @dates = week_dates(@date)

    if @student
      @subjects = @student.all_subjects.includes(:completions, :subject_options, :teachable)
      subject_ids = @subjects.pluck(:id)
      week_completion_records = Completion.joins(:subject)
                                          .left_joins(:subject_option)
                                          .where(subject_id: subject_ids)
                                          .where(date: @week_start..@week_end)
                                          .pluck(:subject_id, :date, "subject_options.name")
      @week_completions = week_completion_records
                            .group_by(&:first)
                            .transform_values { |v| v.map(&:second).to_set }
      @week_pick1_options = week_completion_records
                              .select { |_, _, option_name| option_name.present? }
                              .each_with_object({}) { |(subject_id, date, option_name), hash| hash[[ subject_id, date ]] = option_name }
      @week_narrations = Narration.joins(:recording)
                                  .where(recordings: { student_id: @student.id, date: @week_start..@week_end })
                                  .pluck(:subject_id, "recordings.date")
                                  .group_by(&:first)
                                  .transform_values { |v| v.map(&:last).to_set }
    else
      @subjects = []
      @week_completions = {}
      @week_pick1_options = {}
      @week_narrations = {}
    end

    @total_possible = calculate_week_possible(@subjects, @dates)
    @total_completed = @week_completions.values.sum(&:size)

    # For Duet view: load daily focus data for current day (only active subjects)
    if @student
      @daily_subjects = @subjects.select { |s| s.active_on?(@date) }
      @off_day_subjects = @subjects.select { |s| s.scheduled? && !s.active_on?(@date) }
      daily_completions_records = Completion.where(subject: @daily_subjects, date: @date)
      @daily_completions = daily_completions_records.pluck(:subject_id).to_set
      @pick1_selections = daily_completions_records.where.not(subject_option_id: nil)
                                                   .pluck(:subject_id, :subject_option_id)
                                                   .to_h
      @daily_quick_notes = @student.recordings
                                   .where(recordable_type: "QuickNote")
                                   .for_date(@date)
                                   .includes(:recordable)
                                   .recent
                                   .map(&:recordable)
    end
  end

  private

  # On weekends, default to Friday (end of week) for the daily focus
  def clamp_to_weekday(date)
    case date.wday
    when 0 then date - 2  # Sunday -> Friday
    when 6 then date - 1  # Saturday -> Friday
    else date
    end
  end
end
