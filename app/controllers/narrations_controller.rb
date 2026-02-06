class NarrationsController < ApplicationController
  before_action :set_student
  before_action :set_recording, only: [ :show, :edit, :update, :destroy ]

  def index
    @recordings = @student.recordings
                          .where(recordable_type: "Narration")
                          .recent
    # Manually preload narrations and their subjects
    ActiveRecord::Associations::Preloader.new(records: @recordings, associations: :recordable).call
    narrations = @recordings.map(&:recordable).compact
    ActiveRecord::Associations::Preloader.new(records: narrations, associations: :subject).call

    if params[:date].present?
      @recordings = @recordings.for_date(Date.parse(params[:date]))
    end

    if params[:subject_id].present?
      @recordings = @recordings.joins("INNER JOIN narrations ON recordings.recordable_id = narrations.id")
                              .where(narrations: { subject_id: params[:subject_id] })
    end

    @narrations = @recordings.map(&:recordable)
  end

  def show
    @narration = @recording.recordable
  end

  def new
    @narration = Narration.new(
      subject_id: params[:subject_id],
      narration_type: "text"
    )
    @date = params[:date] || Date.current
    @subjects = @student.all_subjects
    @selected_option = SubjectOption.find_by(id: params[:option_id]) if params[:option_id].present?
  end

  def edit
    @narration = @recording.recordable
    @date = @recording.date
    @subjects = @student.all_subjects
  end

  def create
    @narration = Narration.new(narration_params.except(:date))
    @date = narration_params[:date] || Date.current

    if @narration.valid?
      ActiveRecord::Base.transaction do
        @narration.save!
        @recording = Recording.create!(
          student: @student,
          date: @date,
          recordable: @narration
        )
      end
      redirect_to student_narrations_path(@student), notice: "Narration was successfully created."
    else
      @subjects = @student.all_subjects
      render :new, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordInvalid
    @subjects = @student.all_subjects
    render :new, status: :unprocessable_entity
  end

  def update
    @narration = @recording.recordable

    recording_updates = {}
    recording_updates[:date] = narration_params[:date] if narration_params[:date].present?

    success = ActiveRecord::Base.transaction do
      @narration.update!(narration_params.except(:date))
      @recording.update!(recording_updates) if recording_updates.any?
      true
    rescue ActiveRecord::RecordInvalid
      false
    end

    if success
      redirect_to student_narrations_path(@student), notice: "Narration was successfully updated."
    else
      @date = @recording.date
      @subjects = @student.all_subjects
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @recording.destroy

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

  def set_recording
    @recording = @student.recordings.where(recordable_type: "Narration").find(params[:id])
  rescue ActiveRecord::RecordNotFound
    redirect_to student_narrations_path(@student), alert: "Narration not found"
  end

  def narration_params
    params.require(:narration).permit(:subject_id, :date, :narration_type, :content, :media)
  end
end
