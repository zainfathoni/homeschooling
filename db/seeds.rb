user = User.find_or_create_by!(email: "parent@example.com") do |u|
  u.name = "Parent User"
  u.password = "password123"
end

# Find existing student by teachable name or create new
teachable = Teachable.find_by(name: "Alex", user: user, teachable_type: "Student")
if teachable
  student = teachable.student
else
  student = Student.new
  student.build_teachable(name: "Alex", user: user)
  student.save!
end

subject = Subject.find_or_create_by!(name: "Math", teachable: student.teachable)

puts "Seeded: #{user.email} -> #{student.name} -> #{subject.name}"
