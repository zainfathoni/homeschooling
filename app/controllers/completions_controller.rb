class CompletionsController < ApplicationController
  include WeekHelper

  def toggle
    @subject = Subject.find(params[:subject_id])
    @date = Date.parse(params[:date])

    authorize_subject!

    unless @subject.active_on?(@date)
      head :unprocessable_entity
      return
    end

    @completion = @subject.completions.find_or_initialize_by(date: @date)

    if @subject.pick1?
      handle_pick1_toggle
    else
      handle_standard_toggle
    end

    calculate_week_totals

    respond_to do |format|
      format.turbo_stream
      format.html { redirect_to today_path }
    end
  end

  private

  def handle_pick1_toggle
    option_id = params[:option_id]

    if @completion.persisted? && @completion.subject_option_id == option_id.to_i
      @completion.destroy
      @completed = false
      @selected_option_id = nil
      @pick1_option_name = nil
    else
      @completion.subject_option_id = option_id
      @completion.completed = true
      @completion.save!
      @completed = true
      @selected_option_id = option_id.to_i
      @pick1_option_name = @completion.subject_option&.name
    end
  end

  def handle_standard_toggle
    if @completion.persisted?
      @completion.destroy
      @completed = false
    else
      @completion.completed = true
      @completion.save!
      @completed = true
      check_narration_reminder
    end
  end

  def check_narration_reminder
    @show_narration_reminder = @subject.narration_required? && !@subject.has_narration_for?(@date)
  end

  def calculate_week_totals
    @dates = week_dates(@date)
    week_start = @dates.first
    week_end = @dates.last

    # Scope weekly totals to the subject's teachable (personal or group).
    subjects = Subject.where(teachable_id: @subject.teachable_id)
    week_completions = Completion.where(subject: subjects)
                                 .where(date: week_start..week_end)
                                 .count

    @total_possible = calculate_week_possible(subjects, @dates)
    @total_completed = week_completions
    @is_today = @date == Date.current
    @has_narration = @subject.has_narration_for?(@date)

    calculate_daily_totals(subjects)
  end

  def calculate_daily_totals(subjects)
    @daily_subjects = subjects.select { |s| s.active_on?(@date) }
    @daily_completed = Completion.where(subject: @daily_subjects, date: @date).count
    @daily_total = @daily_subjects.size
  end

  def authorize_subject!
    unless @subject.teachable.user_id == Current.user.id
      redirect_to today_path, alert: "Not authorized"
    end
  end
end
