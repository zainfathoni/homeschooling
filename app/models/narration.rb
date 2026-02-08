class Narration < ApplicationRecord
  belongs_to :subject
  has_one_attached :media

  has_one :recording, as: :recordable, dependent: :destroy, inverse_of: :recordable
  delegate :student, :student_id, :date, to: :recording, allow_nil: true

  # Define enum first so narration_types.keys is available for validation
  enum :narration_type, { text: "text", voice: "voice", photo: "photo", video: "video" }

  validates :narration_type, presence: true, inclusion: { in: narration_types.keys }
  validates :content, presence: true, if: :text?
  validates :media, presence: true, if: -> { voice? || photo? || video? }
  validate :student_matches_subject
  validate :media_content_type_matches_narration_type

  ALLOWED_CONTENT_TYPES = {
    "voice" => %r{\Aaudio/},
    "photo" => %r{\Aimage/},
    "video" => %r{\Avideo/}
  }.freeze

  scope :for_date, ->(date) { joins(:recording).where(recordings: { date: date }) }
  scope :for_student, ->(student) { joins(:recording).where(recordings: { student: student }) }
  scope :for_subject, ->(subject) { where(subject: subject) }
  scope :recent, -> { joins(:recording).order("recordings.date DESC, recordings.created_at DESC") }

  private

  # Validates that the recording's student is allowed to narrate this subject.
  # - For individual subjects: student must match the subject's owner
  # - For group subjects: student must be a member of the group
  def student_matches_subject
    return unless subject.present? && recording&.student.present?

    teachable = subject.teachable
    student = recording.student

    if teachable.student?
      # Individual subject: student must match
      unless teachable.student == student
        errors.add(:subject, "must belong to the same student")
      end
    elsif teachable.student_group?
      # Group subject: student must be a member of the group
      unless teachable.student_group.students.include?(student)
        errors.add(:subject, "student must be a member of the group")
      end
    end
  end

  # Validates that the attached media content type matches the narration type.
  # - voice: must be audio/*
  # - photo: must be image/*
  # - video: must be video/*
  def media_content_type_matches_narration_type
    return unless media.attached? && narration_type.present?

    allowed_pattern = ALLOWED_CONTENT_TYPES[narration_type]
    return unless allowed_pattern # text type has no media requirement

    content_type = media.content_type
    unless content_type&.match?(allowed_pattern)
      errors.add(:media, "must be a #{narration_type} file")
    end
  end
end
