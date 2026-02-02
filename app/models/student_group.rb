class StudentGroup < ApplicationRecord
  has_one :teachable, as: :teachable, dependent: :destroy
  has_many :group_memberships, dependent: :destroy
  has_many :students, through: :group_memberships

  enum :group_type, { family: "family", joint: "joint" }

  validates :group_type, presence: true
end
