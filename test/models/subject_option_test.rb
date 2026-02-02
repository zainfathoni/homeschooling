require "test_helper"

class SubjectOptionTest < ActiveSupport::TestCase
  test "validates name presence" do
    option = SubjectOption.new(subject: subjects(:pick1_islamic))
    assert_not option.valid?
    assert_includes option.errors[:name], "can't be blank"
  end

  test "belongs to subject" do
    option = subject_options(:safar_book)
    assert_equal subjects(:pick1_islamic), option.subject
  end

  test "subject has many subject_options" do
    subject = subjects(:pick1_islamic)
    assert_equal 3, subject.subject_options.count
    assert_includes subject.subject_options, subject_options(:safar_book)
    assert_includes subject.subject_options, subject_options(:quran_recitation)
    assert_includes subject.subject_options, subject_options(:seerah_stories)
  end

  test "subject_options are ordered by position" do
    subject = subjects(:pick1_islamic)
    options = subject.subject_options.to_a
    assert_equal "Safar Book", options[0].name
    assert_equal "Quran Recitation", options[1].name
    assert_equal "Seerah Stories", options[2].name
  end

  test "destroying subject destroys subject_options" do
    subject = subjects(:pick1_islamic)
    option_ids = subject.subject_options.pluck(:id)
    assert_equal 3, option_ids.count

    subject.destroy

    option_ids.each do |id|
      assert_nil SubjectOption.find_by(id: id)
    end
  end

  test "accepts_nested_attributes_for subject_options" do
    subject = Subject.create!(
      name: "Test Pick1",
      teachable: teachables(:student_one_teachable),
      subject_type: "pick1",
      subject_options_attributes: [
        { name: "Option A", position: 0 },
        { name: "Option B", position: 1 }
      ]
    )

    assert_equal 2, subject.subject_options.count
    assert_equal "Option A", subject.subject_options.first.name
    assert_equal "Option B", subject.subject_options.second.name
  end

  test "accepts_nested_attributes_for allows destroy" do
    subject = subjects(:pick1_islamic)
    option = subject.subject_options.first

    subject.update!(
      subject_options_attributes: [
        { id: option.id, _destroy: true }
      ]
    )

    assert_nil SubjectOption.find_by(id: option.id)
  end

  test "accepts_nested_attributes_for rejects all blank" do
    subject = Subject.create!(
      name: "Test Pick1",
      teachable: teachables(:student_one_teachable),
      subject_type: "pick1",
      subject_options_attributes: [
        { name: "Option A", position: 0 },
        { name: "", position: nil }
      ]
    )

    assert_equal 1, subject.subject_options.count
  end

  test "default position is 0" do
    option = SubjectOption.create!(
      subject: subjects(:pick1_islamic),
      name: "New Option"
    )
    assert_equal 0, option.position
  end
end
