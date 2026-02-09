class SetupController < ApplicationController
  layout "setup"

  before_action :redirect_if_setup_complete, only: [ :welcome, :student, :create_student ]

  def welcome
  end

  def student
    @student = Student.new
    @student.build_teachable
  end

  def create_student
    @student = Student.new(student_params)
    @student.build_teachable(user: Current.user) unless @student.teachable
    @student.teachable.user = Current.user if @student.teachable

    if @student.save
      # Select the newly created student
      session[:student_id] = @student.id
      session[:setup_complete] = true
      redirect_to setup_complete_path, notice: "Welcome! Your first student has been added."
    else
      render :student, status: :unprocessable_entity
    end
  end

  def complete
    # If user hasn't just completed setup and has no students, redirect to start
    unless session[:setup_complete] || Current.user.students.exists?
      redirect_to setup_path
      return
    end

    # Clear the flag after showing complete page
    session.delete(:setup_complete)
  end

  private

  def redirect_if_setup_complete
    redirect_to week_path if Current.user.students.exists?
  end

  def student_params
    params.require(:student).permit(:avatar, :avatar_url, :year_level, teachable_attributes: [ :name ])
  end
end
