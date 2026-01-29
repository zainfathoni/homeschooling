class NarrationsController < ApplicationController
  before_action :set_student
  before_action :set_narration, only: [ :show, :edit, :update, :destroy ]

  def index
    @narrations = @student.narrations.includes(:subject).recent

    if params[:date].present?
      @narrations = @narrations.for_date(Date.parse(params[:date]))
    end

    if params[:subject_id].present?
      @narrations = @narrations.for_subject(params[:subject_id])
    end
  end

  def show
  end

  def new
    @narration = @student.narrations.build(
      date: params[:date] || Date.current,
      subject_id: params[:subject_id],
      narration_type: "text"
    )
    @subjects = @student.subjects
  end

  def edit
    @subjects = @student.subjects
  end

  def create
    @narration = @student.narrations.build(narration_params)

    if @narration.save
      redirect_to student_narrations_path(@student), notice: "Narration was successfully created."
    else
      @subjects = @student.subjects
      render :new, status: :unprocessable_entity
    end
  end

  def update
    if @narration.update(narration_params)
      redirect_to student_narrations_path(@student), notice: "Narration was successfully updated."
    else
      @subjects = @student.subjects
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @narration.destroy

    respond_to do |format|
      format.html { redirect_to student_narrations_path(@student), notice: "Narration was successfully deleted." }
      format.turbo_stream
    end
  end

  private

  def set_student
    @student = Current.user.students.find(params[:student_id])
  rescue ActiveRecord::RecordNotFound
    redirect_to students_path, alert: "Student not found"
  end

  def set_narration
    @narration = @student.narrations.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    redirect_to student_narrations_path(@student), alert: "Narration not found"
  end

  def narration_params
    params.require(:narration).permit(:subject_id, :date, :narration_type, :content, :media)
  end
end
