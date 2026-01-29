class AddSubjectTypeToSubjects < ActiveRecord::Migration[8.1]
  def change
    add_column :subjects, :subject_type, :string, default: "fixed", null: false
    add_column :subjects, :scheduled_days, :json
  end
end
