class AddRoleAndStudentToUsers < ActiveRecord::Migration[8.1]
  def change
    # Role determines authorization capabilities:
    # - parent: can complete all subjects (individual + group)
    # - student: can only complete individual subjects they own
    add_column :users, :role, :string, null: false, default: "parent"

    # Student users link to their Student record
    # null for parent users, set for student users
    add_reference :users, :student, null: true, foreign_key: true
  end
end
