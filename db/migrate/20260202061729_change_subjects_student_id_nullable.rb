class ChangeSubjectsStudentIdNullable < ActiveRecord::Migration[8.1]
  def change
    change_column_null :subjects, :student_id, true
    remove_foreign_key :subjects, :students, if_exists: true
  end
end
