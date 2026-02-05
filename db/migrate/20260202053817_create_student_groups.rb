class CreateStudentGroups < ActiveRecord::Migration[8.1]
  def change
    create_table :student_groups do |t|
      t.string :group_type, null: false

      t.timestamps
    end
  end
end
