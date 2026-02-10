class Subject < ApplicationRecord
  belongs_to :teachable

  has_many :completions, dependent: :destroy
  has_many :narrations, dependent: :destroy
  has_many :subject_options, -> { order(:position) }, dependent: :destroy

  accepts_nested_attributes_for :subject_options, allow_destroy: true, reject_if: :all_blank

  validates :name, presence: true
  validates :subject_type, inclusion: { in: %w[fixed scheduled pick1] }
  validates :scheduled_days, presence: true, if: :scheduled?

  enum :subject_type, { fixed: "fixed", scheduled: "scheduled", pick1: "pick1" }

  # View compatibility helpers for transition from subject.student pattern
  # For individual subjects: returns the owner
  # For group subjects: returns the provided fallback (current_student)
  def pick1_balance(date_range)
    selected_counts = completions
      .where(date: date_range)
      .joins(:subject_option)
      .group("subject_options.name")
      .count

    counts = subject_options.each_with_object({}) do |option, h|
      h[option.name] = selected_counts[option.name] || 0
    end

    total = counts.values.sum

    percentages = counts.transform_values do |count|
      total.zero? ? 0.0 : (count.to_f / total * 100).round(1)
    end

    { counts: counts, total: total, percentages: percentages }
  end

  def student_for_narration(current_student)
    teachable.student? ? teachable.student : current_student
  end

  # Check if this subject is accessible by a given student
  def for_student?(student)
    if teachable.student?
      teachable.student == student
    else
      teachable.student_group.students.include?(student)
    end
  end

  # Returns the student if individual subject, nil if group
  def owner_student
    teachable.student? ? teachable.student : nil
  end

  def has_narration_for?(date)
    narrations.for_date(date).exists?
  end

  def active_on?(date)
    day_of_week = date.wday
    weekday_index = day_of_week == 0 ? nil : day_of_week - 1

    return false if weekday_index.nil? || weekday_index > 4

    return true if fixed?
    return true if pick1?
    return false unless scheduled?

    scheduled_days&.include?(weekday_index)
  end
end
