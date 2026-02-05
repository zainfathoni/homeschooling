class RemoveNameFromStudents < ActiveRecord::Migration[8.1]
  def change
    remove_column :students, :name, :string
  end
end
