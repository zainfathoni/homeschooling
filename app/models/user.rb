class User < ApplicationRecord
  has_secure_password

  has_many :teachables, dependent: :destroy
  has_many :students, through: :teachables, source: :teachable, source_type: "Student"
  has_many :student_groups, through: :teachables, source: :teachable, source_type: "StudentGroup"

  # Student users link to their Student record for authorization
  belongs_to :student, optional: true

  # Role determines completion authorization:
  # - parent: can complete all subjects (individual + group)
  # - student: can only complete individual subjects they own
  enum :role, { parent: "parent", student: "student" }, default: :parent

  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :name, presence: true
  validates :student, presence: true, if: :student?

  normalizes :email, with: ->(email) { email.strip.downcase }

  # Check if this user can complete a subject
  # Authorization per ADR-004:
  # - Group subjects: only the owning parent can complete
  # - Individual subjects: owning parent OR the student themselves can complete
  def can_complete?(subject)
    teachable = subject.teachable

    if teachable.student_group?
      # Group subjects: only parent who owns the group
      parent? && teachable.user_id == id
    else
      # Individual subjects: owning parent OR the student themselves
      parent_authorized = parent? && teachable.user_id == id
      student_authorized = student? && student == teachable.student
      parent_authorized || student_authorized
    end
  end
end
