class Recording < ApplicationRecord
  belongs_to :student

  delegated_type :recordable, types: %w[Document QuickNote], dependent: :destroy

  validates :date, presence: true

  scope :recent, -> { order(date: :desc, created_at: :desc) }
  scope :for_date, ->(date) { where(date: date) }
end
