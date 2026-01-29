class SubjectOption < ApplicationRecord
  belongs_to :subject
  has_many :completions, dependent: :nullify

  validates :name, presence: true

  default_scope { order(:position) }
end
