class Teachable < ApplicationRecord
  belongs_to :user

  delegated_type :teachable, types: %w[Student StudentGroup], dependent: :destroy

  has_many :subjects, dependent: :destroy

  validates :name, presence: true
  validates :teachable_type, presence: true
  validates :teachable_id, uniqueness: { scope: :teachable_type }, if: -> { teachable_id.present? }

  scope :students, -> { where(teachable_type: "Student") }
  scope :student_groups, -> { where(teachable_type: "StudentGroup") }
  scope :for_user, ->(user) { where(user: user) }
end
