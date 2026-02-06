class NotesController < ApplicationController
  def index
    @student = current_student

    unless @student
      redirect_to students_path, alert: "Please select a student first."
      return
    end

    @filter = params[:filter]
    @recordings = @student.recordings.includes(:recordable).recent

    case @filter
    when "narrations"
      @recordings = @recordings.where(recordable_type: "Narration")
    when "quick_notes"
      @recordings = @recordings.where(recordable_type: "QuickNote")
    end
  end
end
