class Teachable < ApplicationRecord
  belongs_to :user

  delegated_type :teachable, types: %w[Student StudentGroup], dependent: :destroy

  validates :name, presence: true
  validates :teachable_type, presence: true
  validates :teachable_id, presence: true, uniqueness: { scope: :teachable_type }

  scope :students, -> { where(teachable_type: "Student") }
  scope :student_groups, -> { where(teachable_type: "StudentGroup") }
  scope :for_user, ->(user) { where(user: user) }
end
