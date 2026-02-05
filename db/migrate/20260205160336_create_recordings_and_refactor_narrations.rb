class CreateRecordingsAndRefactorNarrations < ActiveRecord::Migration[8.1]
  def change
    # Create recordings table (superclass)
    create_table :recordings do |t|
      t.references :student, null: false, foreign_key: true
      t.date :date, null: false
      t.string :recordable_type, null: false
      t.bigint :recordable_id, null: false
      t.timestamps
    end

    add_index :recordings, [ :student_id, :date ]
    add_index :recordings, [ :recordable_type, :recordable_id ], unique: true

    # Drop existing narrations table
    drop_table :narrations, if_exists: true

    # Recreate narrations table as delegatee (without student_id/date)
    create_table :narrations do |t|
      t.references :subject, null: false, foreign_key: true
      t.string :narration_type, null: false
      t.text :content
      t.timestamps
    end

    # Create quick_notes table (delegatee)
    create_table :quick_notes do |t|
      t.text :content, null: false
      t.timestamps
    end
  end
end
