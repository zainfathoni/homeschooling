class StudentGroup < ApplicationRecord
  has_one :teachable, as: :teachable, dependent: :destroy

  enum :group_type, { family: "family", joint: "joint" }

  validates :group_type, presence: true
end
