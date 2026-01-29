class SubjectOption < ApplicationRecord
  belongs_to :subject

  validates :name, presence: true

  default_scope { order(:position) }
end
