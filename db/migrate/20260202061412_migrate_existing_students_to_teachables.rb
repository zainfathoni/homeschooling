class MigrateExistingStudentsToTeachables < ActiveRecord::Migration[8.1]
  def up
    return unless column_exists?(:students, :user_id)

    execute <<~SQL
      INSERT INTO teachables (user_id, name, teachable_type, teachable_id, created_at, updated_at)
      SELECT user_id, name, 'Student', id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      FROM students
      WHERE user_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM teachables
          WHERE teachable_type = 'Student' AND teachable_id = students.id
        )
    SQL

    execute <<~SQL
      UPDATE subjects
      SET teachable_id = (
        SELECT teachables.id FROM teachables
        WHERE teachables.teachable_type = 'Student'
          AND teachables.teachable_id = subjects.student_id
      )
      WHERE subjects.teachable_id IS NULL
        AND subjects.student_id IS NOT NULL
    SQL
  end

  def down
    execute <<~SQL
      UPDATE subjects SET teachable_id = NULL
      WHERE teachable_id IN (
        SELECT id FROM teachables WHERE teachable_type = 'Student'
      )
    SQL

    execute <<~SQL
      DELETE FROM teachables WHERE teachable_type = 'Student'
    SQL
  end
end
