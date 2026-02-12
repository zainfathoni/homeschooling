class RenameNarrationsToDocuments < ActiveRecord::Migration[8.1]
  def up
    rename_table :narrations, :documents
    rename_column :documents, :narration_type, :document_type
    Recording.where(recordable_type: "Narration").update_all(recordable_type: "Document")
  end

  def down
    Recording.where(recordable_type: "Document").update_all(recordable_type: "Narration")
    rename_column :documents, :document_type, :narration_type
    rename_table :documents, :narrations
  end
end
