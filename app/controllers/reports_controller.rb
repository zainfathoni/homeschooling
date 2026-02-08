class ReportsController < ApplicationController
  def index
    @students = Current.user.students
    @student = current_student

    anchor = params[:week].present? ? Date.parse(params[:week]) : Date.current
    @week_start = anchor.beginning_of_week
    @week_end = @week_start + 4.days
    @dates = (@week_start..@week_end).to_a

    if @student
      load_weekly_report
    else
      @subjects = []
      @subject_reports = []
      @total_possible = 0
      @total_completed = 0
      @daily = {}
      @weekly_recordings = []
    end

    set_week_nav
  end

  private

  def set_week_nav
    @prev_week = @week_start - 7.days
    @next_week = @week_start + 7.days
    @next_week_disabled = @next_week > Date.current.beginning_of_week
  end

  def load_weekly_report
    @subjects = @student.all_subjects.includes(:teachable, :subject_options)

    subject_ids = @subjects.map(&:id)

    completions = Completion
      .where(subject_id: subject_ids, date: @week_start..@week_end)
      .includes(:subject_option)

    @completions_by_subject_and_date = completions.each_with_object({}) do |c, h|
      h[[ c.subject_id, c.date ]] = c
    end

    @weekly_recordings = Recording
      .where(student: @student, date: @week_start..@week_end)
      .includes(:recordable)
      .order(date: :desc, created_at: :desc)

    build_subject_reports(completions)
    build_daily_breakdown(completions)
  end

  def build_subject_reports(completions)
    completions_count_by_subject = completions.group(:subject_id).count

    @subject_reports = @subjects.map do |subject|
      active_dates = @dates.select { |d| subject.active_on?(d) }
      possible = active_dates.size
      completed = completions_count_by_subject[subject.id].to_i
      rate = possible.zero? ? 0.0 : (completed.to_f / possible)

      {
        subject: subject,
        active_dates: active_dates,
        possible: possible,
        completed: completed,
        rate: rate
      }
    end

    @total_possible = @subject_reports.sum { |r| r[:possible] }
    @total_completed = @subject_reports.sum { |r| r[:completed] }
  end

  def build_daily_breakdown(completions)
    completed_by_date = completions.group(:date).count

    @daily = @dates.each_with_object({}) do |date, h|
      possible = @subjects.count { |s| s.active_on?(date) }
      completed = completed_by_date[date].to_i
      h[date] = { possible: possible, completed: completed }
    end
  end
end
