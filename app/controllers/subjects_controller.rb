class SubjectsController < ApplicationController
  before_action :set_student
  before_action :set_subject, only: [ :edit, :update, :destroy ]

  def index
    @subjects = @student.all_subjects.includes(:subject_options, :teachable)
  end

  def new
    @subject = Subject.new(teachable: @student.teachable)
  end

  def create
    @subject = Subject.new(subject_params.merge(teachable: @student.teachable))

    if @subject.save
      redirect_to student_subjects_path(@student), notice: "Subject was successfully created."
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @subject.update(subject_params)
      redirect_to student_subjects_path(@student), notice: "Subject was successfully updated."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @subject.destroy
    redirect_to student_subjects_path(@student), notice: "Subject was successfully deleted."
  end

  private

  def set_student
    @student = Current.user.students.find(params[:student_id])
  rescue ActiveRecord::RecordNotFound
    redirect_to students_path, alert: "Student not found"
  end

  def set_subject
    @subject = @student.all_subjects.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    redirect_to student_subjects_path(@student), alert: "Subject not found"
  end

  def subject_params
    permitted = params.require(:subject).permit(
      :name, :subject_type, :narration_required, scheduled_days: [],
      subject_options_attributes: [ :id, :name, :position, :_destroy ]
    )

    if permitted[:scheduled_days].present?
      permitted[:scheduled_days] = permitted[:scheduled_days].map(&:to_i)
    end

    permitted
  end
end
