class Student < ApplicationRecord
  has_one :teachable, as: :teachable, dependent: :destroy
  accepts_nested_attributes_for :teachable
  has_one_attached :avatar do |attachable|
    attachable.variant :thumb, resize_to_fill: [ 64, 64 ]
    attachable.variant :medium, resize_to_fill: [ 128, 128 ]
  end

  # Returns only personal subjects; use #all_subjects for personal + group subjects
  has_many :subjects, through: :teachable
  has_many :recordings, dependent: :destroy
  has_many :documents, through: :recordings, source: :recordable, source_type: "Document"
  has_many :group_memberships, dependent: :destroy
  has_many :student_groups, through: :group_memberships

  delegate :user, :user_id, :name, to: :teachable, allow_nil: true

  validates_associated :teachable
  validate :teachable_name_present
  validate :avatar_url_uses_safe_scheme
  validate :avatar_is_valid_image

  def safe_avatar_url
    return nil if avatar_url.blank?

    uri = URI.parse(avatar_url)
    %w[http https].include?(uri.scheme) ? avatar_url : nil
  rescue URI::InvalidURIError
    nil
  end

  # Returns true if student has an avatar (uploaded or URL)
  def avatar?
    avatar.attached? || safe_avatar_url.present?
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

  ALLOWED_AVATAR_TYPES = %w[image/jpeg image/png image/gif image/webp].freeze
  MAX_AVATAR_SIZE = 5.megabytes

  def avatar_is_valid_image
    return unless avatar.attached?

    unless ALLOWED_AVATAR_TYPES.include?(avatar.content_type)
      errors.add(:avatar, "must be a JPEG, PNG, GIF, or WebP image")
    end

    if avatar.byte_size > MAX_AVATAR_SIZE
      errors.add(:avatar, "must be smaller than 5MB")
    end
  end
end
