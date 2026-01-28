class TodayController < ApplicationController
  def index
    @student = Current.user.students.first
    @subjects = @student&.subjects&.includes(:completions) || []
    @date = Date.current
  end
end
