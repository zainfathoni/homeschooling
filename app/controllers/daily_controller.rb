class DailyController < ApplicationController
  def show
    @student = current_student
    @date = parse_date

    unless @student
      redirect_to students_path, alert: "Please select a student first."
      return
    end

    @subjects = @student.subjects.order(:name)
    @completions = Completion.where(subject: @subjects, date: @date).pluck(:subject_id).to_set
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
