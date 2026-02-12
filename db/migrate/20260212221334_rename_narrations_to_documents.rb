class RenameNarrationsToDocuments < ActiveRecord::Migration[8.1]
  def change
    rename_table :narrations, :documents
    rename_column :documents, :narration_type, :document_type

    # Update polymorphic references in recordings
    Recording.where(recordable_type: "Narration").update_all(recordable_type: "Document")
  end
end
