class StudentsController < ApplicationController
  before_action :set_student, only: [ :edit, :update, :destroy, :select ]

  def index
    @students = Current.user.students
  end

  def new
    @student = Student.new
    @student.build_teachable
  end

  def create
    @student = Student.new(student_params)
    @student.build_teachable(user: Current.user) unless @student.teachable
    @student.teachable.user = Current.user if @student.teachable

    if @student.save
      redirect_to students_path, notice: "Student was successfully created."
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @student.update(student_params)
      redirect_to students_path, notice: "Student was successfully updated."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @student.destroy

    if current_student == @student
      session.delete(:student_id)
    end

    redirect_to students_path, notice: "Student was successfully deleted."
  end

  def select
    select_student(@student)

    respond_to do |format|
      format.turbo_stream { redirect_to request.referer || today_path }
      format.html { redirect_to request.referer || today_path }
    end
  end

  private

  def set_student
    @student = Current.user.students.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    redirect_to students_path, alert: "Student not found"
  end

  def student_params
    params.require(:student).permit(:avatar_url, :year_level, teachable_attributes: [ :id, :name ])
  end
end
