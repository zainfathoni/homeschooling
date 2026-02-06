class DailyController < ApplicationController
  def show
    @student = current_student
    @date = parse_date

    unless @student
      redirect_to students_path, alert: "Please select a student first."
      return
    end

    all_subjects = @student.all_subjects.includes(:teachable).order(:name)
    @subjects = all_subjects.select { |s| s.active_on?(@date) }
    @off_day_subjects = all_subjects.select { |s| s.scheduled? && !s.active_on?(@date) }
    completions_records = Completion.where(subject: @subjects, date: @date)
    @completions = completions_records.pluck(:subject_id).to_set
    @pick1_selections = completions_records.where.not(subject_option_id: nil)
                                           .pluck(:subject_id, :subject_option_id)
                                           .to_h

    @quick_notes = @student.recordings
                           .where(recordable_type: "QuickNote")
                           .for_date(@date)
                           .includes(:recordable)
                           .recent
                           .map(&:recordable)
  end

  private

  def parse_date
    if params[:date].present?
      Date.parse(params[:date])
    else
      Date.current
    end
  rescue ArgumentError
    Date.current
  end
end
