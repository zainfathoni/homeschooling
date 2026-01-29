class Student < ApplicationRecord
  belongs_to :user

  has_many :subjects, dependent: :destroy
  has_many :narrations, dependent: :destroy

  validates :name, presence: true
end
