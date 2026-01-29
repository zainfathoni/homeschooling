# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_01_29_050738) do
  create_table "active_storage_attachments", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "record_id", null: false
    t.string "record_type", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.string "content_type"
    t.datetime "created_at", null: false
    t.string "filename", null: false
    t.string "key", null: false
    t.text "metadata"
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "completions", force: :cascade do |t|
    t.boolean "completed", default: false, null: false
    t.datetime "created_at", null: false
    t.date "date", null: false
    t.integer "subject_id", null: false
    t.integer "subject_option_id"
    t.datetime "updated_at", null: false
    t.index ["subject_id"], name: "index_completions_on_subject_id"
    t.index ["subject_option_id"], name: "index_completions_on_subject_option_id"
  end

  create_table "narrations", force: :cascade do |t|
    t.text "content"
    t.datetime "created_at", null: false
    t.date "date", null: false
    t.string "narration_type", null: false
    t.integer "student_id", null: false
    t.integer "subject_id", null: false
    t.datetime "updated_at", null: false
    t.index ["student_id", "date"], name: "index_narrations_on_student_id_and_date"
    t.index ["student_id"], name: "index_narrations_on_student_id"
    t.index ["subject_id", "date"], name: "index_narrations_on_subject_id_and_date"
    t.index ["subject_id"], name: "index_narrations_on_subject_id"
  end

  create_table "students", force: :cascade do |t|
    t.string "avatar_url"
    t.datetime "created_at", null: false
    t.string "name"
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.integer "year_level"
    t.index ["user_id"], name: "index_students_on_user_id"
  end

  create_table "subject_options", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.integer "position", default: 0
    t.integer "subject_id", null: false
    t.datetime "updated_at", null: false
    t.index ["subject_id"], name: "index_subject_options_on_subject_id"
  end

  create_table "subjects", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name"
    t.json "scheduled_days"
    t.integer "student_id", null: false
    t.string "subject_type", default: "fixed", null: false
    t.datetime "updated_at", null: false
    t.index ["student_id"], name: "index_subjects_on_student_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.string "name", null: false
    t.string "password_digest", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "completions", "subject_options"
  add_foreign_key "completions", "subjects"
  add_foreign_key "narrations", "students"
  add_foreign_key "narrations", "subjects"
  add_foreign_key "students", "users"
  add_foreign_key "subject_options", "subjects"
  add_foreign_key "subjects", "students"
end
