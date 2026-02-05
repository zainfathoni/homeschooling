class StudentGroup < ApplicationRecord
  has_one :teachable, as: :teachable, dependent: :destroy
  accepts_nested_attributes_for :teachable

  has_many :group_memberships, dependent: :destroy
  has_many :students, through: :group_memberships

  enum :group_type, { family: "family", joint: "joint" }

  delegate :user, :user_id, :name, to: :teachable, allow_nil: true

  validates :group_type, presence: true
  validates_associated :teachable
end
