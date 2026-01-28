module StudentSelection
  extend ActiveSupport::Concern

  included do
    before_action :set_current_student
    helper_method :current_student
  end

  def current_student
    @current_student
  end

  private

  def set_current_student
    return unless Current.user

    @current_student = if session[:student_id]
      Current.user.students.find_by(id: session[:student_id])
    end
    @current_student ||= Current.user.students.first
  end

  def select_student(student)
    session[:student_id] = student.id
    @current_student = student
  end
end
