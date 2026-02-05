class CreateTeachables < ActiveRecord::Migration[8.1]
  def change
    create_table :teachables do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      t.string :teachable_type, null: false
      t.integer :teachable_id, null: false

      t.timestamps
    end

    add_index :teachables, [ :teachable_type, :teachable_id ], unique: true
  end
end
