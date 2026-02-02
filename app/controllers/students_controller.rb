class StudentsController < ApplicationController
  before_action :set_student, only: [ :edit, :update, :destroy, :select ]

  def index
    @students = Current.user.students
  end

  def new
    @student = Student.new
  end

  def create
    @student = Student.new(student_params.except(:name))
    @student.build_teachable(name: student_params[:name], user: Current.user)

    if @student.save
      redirect_to students_path, notice: "Student was successfully created."
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    student_attrs = student_params.except(:name)
    teachable_attrs = { name: student_params[:name] }.compact

    if @student.update(student_attrs) && @student.teachable.update(teachable_attrs)
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
    params.require(:student).permit(:name, :avatar_url, :year_level)
  end
end
