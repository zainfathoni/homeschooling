# frozen_string_literal: true

module StudentsHelper
  def completion_percentage(stats)
    return 0 if stats[:total].to_i <= 0

    (stats[:completed].to_f / stats[:total] * 100).round
  end

  def subject_type_badge_class(subject_type)
    case subject_type
    when "fixed"
      "bg-blue-50 text-blue-600"
    when "scheduled"
      "bg-green-50 text-green-600"
    else
      "bg-purple-50 text-purple-600"
    end
  end

  # Renders student avatar with fallback chain: uploaded avatar -> avatar_url -> initials
  # Options:
  #   size: :small (28px), :medium (40px), :large (64px) - default :medium
  #   class: additional CSS classes
  def student_avatar(student, size: :medium, **options)
    # Explicit class mappings to avoid Tailwind purge issues with interpolation
    size_classes = {
      small:  "w-7 h-7",
      medium: "w-10 h-10",
      large:  "w-16 h-16"
    }
    text_sizes = {
      small:  "text-sm",
      medium: "text-base",
      large:  "text-2xl"
    }
    size_class = size_classes[size] || size_classes[:medium]
    text_size = text_sizes[size] || text_sizes[:medium]
    base_class = "#{size_class} rounded-full object-cover"
    extra_class = options[:class]

    # Select variant based on display size for better image optimization
    variant_name = size == :large ? :medium : :thumb

    if student.avatar.attached?
      image_tag student.avatar.variant(variant_name),
                alt: student.name,
                class: [ base_class, extra_class ].compact.join(" ")
    elsif student.safe_avatar_url.present?
      tag.img src: student.safe_avatar_url,
              alt: student.name,
              class: [ base_class, extra_class ].compact.join(" ")
    else
      initials_class = "#{size_class} rounded-full flex items-center justify-center"
      name = student.name.to_s
      initial = name.first&.upcase || "?"

      tag.div class: [ initials_class, "bg-coral/20 text-coral font-bold", text_size, extra_class ].compact.join(" "),
              aria: { label: name.presence || "Student" } do
        initial
      end
    end
  end
end
