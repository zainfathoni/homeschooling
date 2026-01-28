class AddAvatarAndYearLevelToStudents < ActiveRecord::Migration[8.1]
  def change
    add_column :students, :avatar_url, :string
    add_column :students, :year_level, :integer
  end
end
