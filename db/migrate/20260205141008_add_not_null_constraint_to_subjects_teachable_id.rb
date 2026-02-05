class AddNotNullConstraintToSubjectsTeachableId < ActiveRecord::Migration[8.1]
  def change
    change_column_null :subjects, :teachable_id, false
  end
end
