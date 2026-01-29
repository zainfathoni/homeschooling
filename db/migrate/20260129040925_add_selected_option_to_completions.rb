class AddSelectedOptionToCompletions < ActiveRecord::Migration[8.1]
  def change
    add_reference :completions, :subject_option, foreign_key: true
  end
end
