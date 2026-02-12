class QuickNotesController < ApplicationController
  before_action :set_student
  before_action :set_recording, only: [ :show, :edit, :update, :destroy ]

  def index
    @recordings = @student.recordings
                          .where(recordable_type: "QuickNote")
                          .recent

    if params[:date].present?
      @recordings = @recordings.for_date(Date.parse(params[:date]))
    end

    @quick_notes = @recordings.map(&:recordable)
  end

  def show
    @quick_note = @recording.recordable
  end

  def new
    @quick_note = QuickNote.new
    @date = params[:date] || Date.current
  end

  def edit
    @quick_note = @recording.recordable
    @date = @recording.date
  end

  def create
    @quick_note = QuickNote.new(quick_note_params)
    @date = params[:quick_note][:date] || Date.current

    if @quick_note.valid?
      ActiveRecord::Base.transaction do
        @quick_note.save!
        @recording = Recording.create!(
          student: @student,
          date: @date,
          recordable: @quick_note
        )
      end

      respond_to do |format|
        format.html { redirect_to student_quick_notes_path(@student), notice: "Quick note was successfully created." }
        format.turbo_stream
      end
    else
      render :new, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordInvalid
    render :new, status: :unprocessable_entity
  end

  def update
    @quick_note = @recording.recordable

    recording_updates = {}
    recording_updates[:date] = params[:quick_note][:date] if params[:quick_note][:date].present?

    success = ActiveRecord::Base.transaction do
      @quick_note.update!(quick_note_params)
      @recording.update!(recording_updates) if recording_updates.any?
      true
    rescue ActiveRecord::RecordInvalid
      false
    end

    if success
      respond_to do |format|
        format.html { redirect_to student_quick_notes_path(@student), notice: "Quick note was successfully updated." }
        format.turbo_stream
      end
    else
      @date = @recording.date
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @recording.destroy

    respond_to do |format|
      format.html { redirect_to student_quick_notes_path(@student), notice: "Quick note was successfully deleted." }
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
    @recording = @student.recordings.where(recordable_type: "QuickNote").find(params[:id])
  rescue ActiveRecord::RecordNotFound
    redirect_to student_quick_notes_path(@student), alert: "Quick note not found"
  end

  def quick_note_params
    params.require(:quick_note).permit(:content, :audio)
  end
end
