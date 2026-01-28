class Subject < ApplicationRecord
  belongs_to :student

  has_many :completions, dependent: :destroy

  validates :name, presence: true
end
