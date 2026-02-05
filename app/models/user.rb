class User < ApplicationRecord
  has_secure_password

  has_many :teachables, dependent: :destroy
  has_many :students, through: :teachables, source: :teachable, source_type: "Student"
  has_many :student_groups, through: :teachables, source: :teachable, source_type: "StudentGroup"

  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :name, presence: true

  normalizes :email, with: ->(email) { email.strip.downcase }
end
