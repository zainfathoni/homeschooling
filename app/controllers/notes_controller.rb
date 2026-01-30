class NotesController < ApplicationController
  def index
    @student = current_student

    unless @student
      redirect_to students_path, alert: "Please select a student first."
      return
    end

    redirect_to student_narrations_path(@student)
  end
end
