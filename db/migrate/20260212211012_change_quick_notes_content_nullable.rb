class ChangeQuickNotesContentNullable < ActiveRecord::Migration[8.1]
  def change
    change_column_null :quick_notes, :content, true
  end
end
