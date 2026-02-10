class UpdateUsersStudentForeignKey < ActiveRecord::Migration[8.1]
  def change
    # Remove the existing FK that blocks student deletion
    remove_foreign_key :users, :students

    # Re-add with on_delete: :nullify so deleting a student
    # just nullifies the user's student_id instead of failing
    add_foreign_key :users, :students, on_delete: :nullify
  end
end
