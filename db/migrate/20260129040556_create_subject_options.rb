class CreateSubjectOptions < ActiveRecord::Migration[8.1]
  def change
    create_table :subject_options do |t|
      t.references :subject, null: false, foreign_key: true
      t.string :name, null: false
      t.integer :position, default: 0

      t.timestamps
    end
  end
end
