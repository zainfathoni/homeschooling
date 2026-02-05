class QuickNote < ApplicationRecord
  has_one :recording, as: :recordable, dependent: :destroy, inverse_of: :recordable
  delegate :student, :student_id, :date, to: :recording

  validates :content, presence: true
end
