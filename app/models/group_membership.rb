class GroupMembership < ApplicationRecord
  belongs_to :student_group
  belongs_to :student

  validates :student_id, uniqueness: { scope: :student_group_id }
end
