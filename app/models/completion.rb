class Completion < ApplicationRecord
  belongs_to :subject

  validates :date, presence: true
  validates :subject_id, uniqueness: { scope: :date, message: "already has a completion for this date" }
end
