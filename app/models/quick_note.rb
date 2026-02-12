class QuickNote < ApplicationRecord
  has_one :recording, as: :recordable, dependent: :destroy, inverse_of: :recordable
  has_one_attached :audio

  delegate :student, :student_id, :date, to: :recording, allow_nil: true

  validate :content_or_audio_present
  validate :audio_content_type

  private

  def content_or_audio_present
    if content.blank? && !audio.attached?
      errors.add(:base, "Must provide either text content or an audio recording")
    end
  end

  def audio_content_type
    return unless audio.attached?

    unless audio.content_type&.match?(%r{\Aaudio/})
      errors.add(:audio, "must be an audio file")
    end
  end
end
