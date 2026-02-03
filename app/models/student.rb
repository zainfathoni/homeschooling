class Student < ApplicationRecord
  has_one :teachable, as: :teachable, dependent: :destroy
  accepts_nested_attributes_for :teachable

  has_many :subjects, dependent: :destroy
  has_many :narrations, dependent: :destroy
  has_many :group_memberships, dependent: :destroy
  has_many :student_groups, through: :group_memberships

  delegate :user, :user_id, to: :teachable, allow_nil: true

  validates :name, presence: true, if: -> { teachable.blank? }
  validates_associated :teachable

  def name
    teachable&.name || super
  end

  def all_subjects
    Subject.where(teachable_id: all_teachable_ids)
  end

  def all_teachable_ids
    @all_teachable_ids ||= begin
      group_ids = student_groups.joins(:teachable).pluck("teachables.id")
      [ teachable&.id, *group_ids ].compact
    end
  end
end
