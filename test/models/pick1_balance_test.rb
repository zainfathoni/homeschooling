require "test_helper"

class Pick1BalanceTest < ActiveSupport::TestCase
  setup do
    @subject = subjects(:pick1_islamic)
    @safar = subject_options(:safar_book)
    @quran = subject_options(:quran_recitation)
    @seerah = subject_options(:seerah_stories)
  end

  test "returns zero counts when no completions exist" do
    result = @subject.pick1_balance(Date.new(2026, 1, 1)..Date.new(2026, 1, 31))

    assert_equal({ "Safar Book" => 0, "Quran Recitation" => 0, "Seerah Stories" => 0 }, result[:counts])
    assert_equal 0, result[:total]
    assert_equal({ "Safar Book" => 0.0, "Quran Recitation" => 0.0, "Seerah Stories" => 0.0 }, result[:percentages])
  end

  test "counts completions per option within date range" do
    Completion.create!(subject: @subject, date: Date.new(2026, 1, 5), subject_option: @safar)
    Completion.create!(subject: @subject, date: Date.new(2026, 1, 6), subject_option: @safar)
    Completion.create!(subject: @subject, date: Date.new(2026, 1, 7), subject_option: @quran)

    result = @subject.pick1_balance(Date.new(2026, 1, 1)..Date.new(2026, 1, 31))

    assert_equal 2, result[:counts]["Safar Book"]
    assert_equal 1, result[:counts]["Quran Recitation"]
    assert_equal 0, result[:counts]["Seerah Stories"]
    assert_equal 3, result[:total]
  end

  test "calculates correct percentages" do
    Completion.create!(subject: @subject, date: Date.new(2026, 1, 5), subject_option: @safar)
    Completion.create!(subject: @subject, date: Date.new(2026, 1, 6), subject_option: @safar)
    Completion.create!(subject: @subject, date: Date.new(2026, 1, 7), subject_option: @quran)
    Completion.create!(subject: @subject, date: Date.new(2026, 1, 8), subject_option: @seerah)

    result = @subject.pick1_balance(Date.new(2026, 1, 1)..Date.new(2026, 1, 31))

    assert_equal 50.0, result[:percentages]["Safar Book"]
    assert_equal 25.0, result[:percentages]["Quran Recitation"]
    assert_equal 25.0, result[:percentages]["Seerah Stories"]
  end

  test "excludes completions outside date range" do
    Completion.create!(subject: @subject, date: Date.new(2026, 1, 5), subject_option: @safar)
    Completion.create!(subject: @subject, date: Date.new(2026, 2, 15), subject_option: @quran)

    result = @subject.pick1_balance(Date.new(2026, 1, 1)..Date.new(2026, 1, 31))

    assert_equal 1, result[:counts]["Safar Book"]
    assert_equal 0, result[:counts]["Quran Recitation"]
    assert_equal 1, result[:total]
  end

  test "shows never-selected options with zero count" do
    Completion.create!(subject: @subject, date: Date.new(2026, 1, 5), subject_option: @safar)

    result = @subject.pick1_balance(Date.new(2026, 1, 1)..Date.new(2026, 1, 31))

    assert_equal 0, result[:counts]["Seerah Stories"]
    assert_equal 0.0, result[:percentages]["Seerah Stories"]
  end
end
