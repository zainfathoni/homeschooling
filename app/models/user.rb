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
  # Note: student association is optional - FK uses on_delete: :nullify
  # When a Student record is deleted, student_id becomes null and role is demoted

  # Demote role to parent when student association is nullified
  # (e.g., when the linked Student record is deleted)
  # This runs before validation so the student_required check passes
  before_validation :demote_role_if_student_orphaned

  # Only validate student presence for new student users, not when being demoted
  validate :student_required_for_new_student_role

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
      # Student users without a linked student cannot complete anything
      student_authorized = student? && student.present? && student == teachable.student
      parent_authorized || student_authorized
    end
  end

  private

  def student_required_for_new_student_role
    # Only validate for new records or when changing TO student role
    # Don't validate when being demoted (student_id removed)
    if student? && student_id.nil? && !student_id_was.present?
      errors.add(:student, "is required for student role")
    end
  end

  def demote_role_if_student_orphaned
    # If student_id was nullified (e.g., Student record deleted) and role is student,
    # automatically demote to parent to maintain data integrity
    if student? && student_id.nil? && student_id_was.present?
      self.role = :parent
    end
  end
end
