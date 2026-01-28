class Student < ApplicationRecord
  belongs_to :user

  has_many :subjects, dependent: :destroy

  validates :name, presence: true
end
