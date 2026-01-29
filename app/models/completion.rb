class Completion < ApplicationRecord
  belongs_to :subject
  belongs_to :subject_option, optional: true

  validates :date, presence: true
  validates :subject_id, uniqueness: { scope: :date, message: "already has a completion for this date" }
  validates :subject_option, presence: true, if: -> { subject&.pick1? }
end
