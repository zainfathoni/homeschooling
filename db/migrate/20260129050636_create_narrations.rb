class CreateNarrations < ActiveRecord::Migration[8.1]
  def change
    create_table :narrations do |t|
      t.references :student, null: false, foreign_key: true
      t.references :subject, null: false, foreign_key: true
      t.date :date, null: false
      t.string :narration_type, null: false
      t.text :content

      t.timestamps
    end

    add_index :narrations, [ :student_id, :date ]
    add_index :narrations, [ :subject_id, :date ]
  end
end
