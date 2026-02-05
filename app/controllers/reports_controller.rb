class ReportsController < ApplicationController
  def index
    @students = Current.user.students
    @student = current_student
    @start_date = Date.current.beginning_of_week
    @end_date = Date.current

    if @student
      @subjects = @student.all_subjects.includes(:completions, :teachable)
      @dates = (@start_date..@end_date).to_a
      subject_ids = @subjects.pluck(:id)

      completions_this_week = Completion.where(subject_id: subject_ids)
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
