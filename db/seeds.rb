# Production-like seed data for testing the Teachable migration

puts "Seeding production-like test data..."

# Create multiple users (families)
users = []
3.times do |i|
  users << User.find_or_create_by!(email: "family#{i + 1}@example.com") do |u|
    u.name = "Family #{i + 1} Parent"
    u.password = "password123"
  end
end

student_names = [
  %w[Alex Emma],           # Family 1
  %w[Oliver Sophia Liam],  # Family 2
  %w[Ava Noah]             # Family 3
]

subject_configs = [
  { name: "Math", subject_type: "fixed" },
  { name: "Handwriting", subject_type: "fixed" },
  { name: "Coding", subject_type: "scheduled", scheduled_days: [0, 1, 2, 3] },
  { name: "Islamic Study", subject_type: "pick1" },
  { name: "Reading", subject_type: "fixed", narration_required: true }
]

pick1_options = ["Safar Book", "Quran Memorization", "Hadith Study"]

all_students = []
all_subjects = []

users.each_with_index do |user, user_idx|
  student_names[user_idx].each do |name|
    # Find or create student with teachable
    teachable = Teachable.find_by(name: name, user: user, teachable_type: "Student")
    if teachable
      student = teachable.student
    else
      student = Student.new
      student.build_teachable(name: name, user: user)
      student.save!
    end
    all_students << student

    # Create subjects for this student
    subject_configs.each do |config|
      subject = Subject.find_or_create_by!(name: config[:name], teachable: student.teachable) do |s|
        s.subject_type = config[:subject_type]
        s.scheduled_days = config[:scheduled_days]
        s.narration_required = config[:narration_required] || false
      end
      all_subjects << subject

      # Add options for pick1 subjects
      if subject.pick1? && subject.subject_options.empty?
        pick1_options.each_with_index do |opt_name, pos|
          subject.subject_options.create!(name: opt_name, position: pos)
        end
      end
    end

    puts "  Created #{name} with #{subject_configs.size} subjects"
  end
end

# Create completions for the past 2 weeks
puts "Creating completions..."
completion_count = 0
(Date.current - 14..Date.current - 1).each do |date|
  next if date.saturday? || date.sunday?

  all_subjects.each do |subject|
    next unless subject.active_on?(date)
    next if rand > 0.7 # 70% completion rate

    attrs = { date: date, completed: true }
    if subject.pick1?
      option = subject.subject_options.sample
      attrs[:subject_option_id] = option.id if option
    end

    subject.completions.find_or_create_by!(date: date) do |c|
      c.completed = attrs[:completed]
      c.subject_option_id = attrs[:subject_option_id]
    end
    completion_count += 1
  end
end
puts "  Created #{completion_count} completions"

# Create narrations for subjects that require them
puts "Creating narrations..."
narration_count = 0
all_subjects.select(&:narration_required?).each do |subject|
  student = subject.owner_student
  next unless student

  (Date.current - 14..Date.current - 1).each do |date|
    next if date.saturday? || date.sunday?
    next unless subject.active_on?(date)
    next if rand > 0.5 # 50% have narrations

    Narration.find_or_create_by!(subject: subject, student: student, date: date) do |n|
      n.narration_type = "text"
      n.content = "#{student.name} worked on #{subject.name} today. Great progress!"
    end
    narration_count += 1
  end
end
puts "  Created #{narration_count} narrations"

puts "\nSeed complete!"
puts "  Users: #{User.count}"
puts "  Students: #{Student.count}"
puts "  Teachables: #{Teachable.count}"
puts "  Subjects: #{Subject.count}"
puts "  Completions: #{Completion.count}"
puts "  Narrations: #{Narration.count}"
