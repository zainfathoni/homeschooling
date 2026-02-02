class Narration < ApplicationRecord
  belongs_to :student
  belongs_to :subject

  has_one_attached :media

  validates :date, presence: true
  validates :narration_type, presence: true, inclusion: { in: %w[text voice photo] }
  validates :content, presence: true, if: :text?
  validates :media, presence: true, if: -> { voice? || photo? }
  validate :student_matches_subject

  enum :narration_type, { text: "text", voice: "voice", photo: "photo" }

  scope :for_date, ->(date) { where(date: date) }
  scope :for_student, ->(student) { where(student: student) }
  scope :for_subject, ->(subject) { where(subject: subject) }
  scope :recent, -> { order(created_at: :desc) }

  private

  def student_matches_subject
    return unless subject.present? && student.present?
    unless subject.for_student?(student)
      errors.add(:subject, "must belong to the same student or group")
    end
  end
end
