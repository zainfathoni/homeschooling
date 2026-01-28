user = User.find_or_create_by!(email: "parent@example.com") do |u|
  u.name = "Parent User"
  u.password = "password123"
end

student = user.students.find_or_create_by!(name: "Alex")

subject = student.subjects.find_or_create_by!(name: "Math")

puts "Seeded: #{user.email} -> #{student.name} -> #{subject.name}"
