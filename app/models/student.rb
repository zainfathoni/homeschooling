class Student < ApplicationRecord
  has_one :teachable, as: :teachable, dependent: :destroy
  accepts_nested_attributes_for :teachable

  # Returns only personal subjects; use #all_subjects for personal + group subjects
  has_many :subjects, through: :teachable
  has_many :recordings, dependent: :destroy
  has_many :narrations, through: :recordings, source: :recordable, source_type: "Narration"
  has_many :group_memberships, dependent: :destroy
  has_many :student_groups, through: :group_memberships

  delegate :user, :user_id, :name, to: :teachable, allow_nil: true

  validates_associated :teachable
  validate :teachable_name_present
  validate :avatar_url_uses_safe_scheme

  def safe_avatar_url
    return nil if avatar_url.blank?

    uri = URI.parse(avatar_url)
    %w[http https].include?(uri.scheme) ? avatar_url : nil
  rescue URI::InvalidURIError
    nil
  end

  def all_subjects
    Subject.where(teachable_id: all_teachable_ids)
  end

  def all_teachable_ids
    @all_teachable_ids ||= begin
      group_ids = student_groups.joins(:teachable).pluck("teachables.id")
      [ teachable&.id, *group_ids ].compact
    end
  end

  private

  def teachable_name_present
    return if teachable.nil? || teachable.name.present?

    errors.add(:name, "can't be blank")
  end

  def avatar_url_uses_safe_scheme
    return if avatar_url.blank?

    uri = URI.parse(avatar_url)
    unless %w[http https].include?(uri.scheme)
      errors.add(:avatar_url, "must use http or https")
    end
  rescue URI::InvalidURIError
    errors.add(:avatar_url, "is not a valid URL")
  end
end
