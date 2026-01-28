class CompletionsController < ApplicationController
  include WeekHelper

  def toggle
    @subject = Subject.find(params[:subject_id])
    @date = Date.parse(params[:date])

    authorize_subject!

    @completion = @subject.completions.find_or_initialize_by(date: @date)

    if @completion.persisted?
      @completion.destroy
      @completed = false
    else
      @completion.completed = true
      @completion.save!
      @completed = true
    end

    calculate_week_totals

    respond_to do |format|
      format.turbo_stream
      format.html { redirect_to today_path }
    end
  end

  private

  def calculate_week_totals
    student = @subject.student
    @dates = week_dates(@date)
    week_start = @dates.first
    week_end = @dates.last

    subjects = student.subjects
    week_completions = Completion.joins(:subject)
                                 .where(subjects: { student_id: student.id })
                                 .where(date: week_start..week_end)
                                 .count

    @total_possible = subjects.count * @dates.count
    @total_completed = week_completions
    @is_today = @date == Date.current
  end

  def authorize_subject!
    unless @subject.student.user_id == Current.user.id
      redirect_to today_path, alert: "Not authorized"
    end
  end
end
