class TodayController < ApplicationController
  def index
    @students = Current.user.students
    @student = current_student
    @subjects = @student&.subjects&.includes(:completions) || []
    @date = Date.current
  end
end
