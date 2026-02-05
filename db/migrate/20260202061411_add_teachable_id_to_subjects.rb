class AddTeachableIdToSubjects < ActiveRecord::Migration[8.1]
  def change
    add_column :subjects, :teachable_id, :integer
    add_index :subjects, :teachable_id
    add_foreign_key :subjects, :teachables
  end
end
