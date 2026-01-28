class CreateCompletions < ActiveRecord::Migration[8.1]
  def change
    create_table :completions do |t|
      t.references :subject, null: false, foreign_key: true
      t.date :date, null: false
      t.boolean :completed, default: false, null: false

      t.timestamps
    end
  end
end
