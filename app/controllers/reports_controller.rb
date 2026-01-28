class ReportsController < ApplicationController
  def index
    @students = Current.user.students
    @student = current_student
    @start_date = Date.current.beginning_of_week
    @end_date = Date.current

    if @student
      @subjects = @student.subjects.includes(:completions)
      @dates = (@start_date..@end_date).to_a

      completions_this_week = Completion.joins(:subject)
                                        .where(subjects: { student_id: @student.id })
                                        .where(date: @start_date..@end_date)

      @total_possible = @subjects.count * @dates.count
      @total_completed = completions_this_week.count
    else
      @subjects = []
      @dates = []
      @total_possible = 0
      @total_completed = 0
    end
  end
end
