class User < ApplicationRecord
  has_secure_password

  has_many :teachables, dependent: :destroy

  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :name, presence: true

  normalizes :email, with: ->(email) { email.strip.downcase }

  def students
    Student.joins(:teachable).where(teachables: { user_id: id })
  end

  def student_groups
    StudentGroup.joins(:teachable).where(teachables: { user_id: id })
  end
end
