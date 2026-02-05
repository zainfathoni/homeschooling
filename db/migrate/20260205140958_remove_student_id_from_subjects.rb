class RemoveStudentIdFromSubjects < ActiveRecord::Migration[8.1]
  def change
    remove_index :subjects, :student_id, if_exists: true
    remove_column :subjects, :student_id, :integer
  end
end
