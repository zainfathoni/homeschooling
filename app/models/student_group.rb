class StudentGroup < ApplicationRecord
  has_one :teachable, as: :teachable, dependent: :destroy
  accepts_nested_attributes_for :teachable

  has_many :group_memberships, dependent: :destroy
  has_many :students, through: :group_memberships

  enum :group_type, { family: "family", joint: "joint" }

  delegate :user, :user_id, :name, :teachable_id, to: :teachable, allow_nil: true

  validates :group_type, presence: true
  validates_associated :teachable
  validate :teachable_name_present

  private

  def teachable_name_present
    return if teachable.nil? || teachable.name.present?

    errors.add(:name, "can't be blank")
  end
end
