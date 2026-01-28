class CompletionsController < ApplicationController
  def toggle
    @subject = Subject.find(params[:subject_id])
    @date = Date.parse(params[:date])

    authorize_subject!

    @completion = @subject.completions.find_or_initialize_by(date: @date)

    if @completion.persisted?
      @completion.destroy
    else
      @completion.completed = true
      @completion.save!
    end

    respond_to do |format|
      format.turbo_stream
      format.html { redirect_to today_path }
    end
  end

  private

  def authorize_subject!
    unless @subject.student.user_id == Current.user.id
      redirect_to today_path, alert: "Not authorized"
    end
  end
end
