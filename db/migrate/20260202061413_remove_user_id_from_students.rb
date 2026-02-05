class RemoveUserIdFromStudents < ActiveRecord::Migration[8.1]
  def change
    remove_foreign_key :students, :users
    remove_index :students, :user_id
    remove_column :students, :user_id, :integer
  end
end
