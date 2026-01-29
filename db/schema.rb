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

ActiveRecord::Schema[8.1].define(version: 2026_01_29_040925) do
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

  add_foreign_key "completions", "subject_options"
  add_foreign_key "completions", "subjects"
  add_foreign_key "students", "users"
  add_foreign_key "subject_options", "subjects"
  add_foreign_key "subjects", "students"
end
