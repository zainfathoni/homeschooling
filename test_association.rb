ENV['RAILS_ENV'] = 'test'
require_relative 'config/environment'

puts "User count: #{User.count}"
user = User.create!(email: "test@example.com", password: "password", name: "Test User")

puts "Testing user.students.build..."
begin
  student = user.students.build
  puts "Student built: #{student.inspect}"
  puts "Student teachable: #{student.teachable.inspect}"
  
  # Try setting name (delegated)
  begin
    student.name = "Test Student"
    puts "Name set to: #{student.name}"
  rescue => e
    puts "Error setting name: #{e.message}"
  end

  # Try saving
  if student.save
    puts "Student saved successfully"
  else
    puts "Student save failed: #{student.errors.full_messages}"
    puts "Teachable errors: #{student.teachable&.errors&.full_messages}" if student.teachable
  end
rescue => e
  puts "Error during build: #{e.message}"
  puts e.backtrace
end

puts "\nTesting user.students.create..."
begin
  # We probably need to pass teachable attributes if we want to set name
  # Or rely on delegation if the object is initialized correctly
  student2 = user.students.create(name: "Student 2")
  if student2.persisted?
    puts "Student 2 created: #{student2.id}"
    puts "Student 2 teachable: #{student2.teachable.inspect}"
  else
    puts "Student 2 failed: #{student2.errors.full_messages}"
    puts "Teachable errors: #{student2.teachable&.errors&.full_messages}" if student2.teachable
  end
rescue => e
  puts "Error during create: #{e.message}"
end
