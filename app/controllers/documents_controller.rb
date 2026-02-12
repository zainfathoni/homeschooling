class DocumentsController < ApplicationController
  before_action :set_student
  before_action :set_recording, only: [ :show, :edit, :update, :destroy ]

  def index
    @recordings = @student.recordings
                          .where(recordable_type: "Document")
                          .recent
    # Manually preload documents and their subjects
    ActiveRecord::Associations::Preloader.new(records: @recordings, associations: :recordable).call
    documents = @recordings.map(&:recordable).compact
    ActiveRecord::Associations::Preloader.new(records: documents, associations: :subject).call

    if params[:date].present?
      @recordings = @recordings.for_date(Date.parse(params[:date]))
    end

    if params[:subject_id].present?
      @recordings = @recordings.joins("INNER JOIN documents ON recordings.recordable_id = documents.id")
                              .where(documents: { subject_id: params[:subject_id] })
    end

    @documents = @recordings.map(&:recordable)
  end

  def show
    @document = @recording.recordable
  end

  def new
    @document = Document.new(
      subject_id: params[:subject_id],
      document_type: "text"
    )
    @date = params[:date] || Date.current
    @subjects = @student.all_subjects
    @selected_option = SubjectOption.find_by(id: params[:option_id]) if params[:option_id].present?
  end

  def edit
    @document = @recording.recordable
    @date = @recording.date
    @subjects = @student.all_subjects
  end

  def create
    @document = Document.new(document_params.except(:date))
    @date = document_params[:date] || Date.current

    if @document.valid?
      ActiveRecord::Base.transaction do
        @document.save!
        @recording = Recording.create!(
          student: @student,
          date: @date,
          recordable: @document
        )
      end
      redirect_to student_documents_path(@student), notice: "Document was successfully created."
    else
      @subjects = @student.all_subjects
      render :new, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordInvalid
    @subjects = @student.all_subjects
    render :new, status: :unprocessable_entity
  end

  def update
    @document = @recording.recordable

    recording_updates = {}
    recording_updates[:date] = document_params[:date] if document_params[:date].present?

    success = ActiveRecord::Base.transaction do
      @document.update!(document_params.except(:date))
      @recording.update!(recording_updates) if recording_updates.any?
      true
    rescue ActiveRecord::RecordInvalid
      false
    end

    if success
      redirect_to student_documents_path(@student), notice: "Document was successfully updated."
    else
      @date = @recording.date
      @subjects = @student.all_subjects
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @recording.destroy

    respond_to do |format|
      format.html { redirect_to student_documents_path(@student), notice: "Document was successfully deleted." }
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
    @recording = @student.recordings.where(recordable_type: "Document").find(params[:id])
  rescue ActiveRecord::RecordNotFound
    redirect_to student_documents_path(@student), alert: "Document not found"
  end

  def document_params
    params.require(:document).permit(:subject_id, :date, :document_type, :content, :media)
  end
end
