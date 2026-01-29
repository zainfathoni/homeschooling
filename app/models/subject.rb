class Subject < ApplicationRecord
  belongs_to :student

  has_many :completions, dependent: :destroy
  has_many :subject_options, -> { order(:position) }, dependent: :destroy

  accepts_nested_attributes_for :subject_options, allow_destroy: true, reject_if: :all_blank

  validates :name, presence: true
  validates :subject_type, inclusion: { in: %w[fixed scheduled pick1] }
  validates :scheduled_days, presence: true, if: :scheduled?

  enum :subject_type, { fixed: "fixed", scheduled: "scheduled", pick1: "pick1" }

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
