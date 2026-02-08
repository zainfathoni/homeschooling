module NavigationHelper
  SECTION_ROOTS = %w[/students /student_groups /notes].freeze

  def nav_active?(path)
    if SECTION_ROOTS.include?(path)
      request.path.start_with?(path)
    else
      current_page?(path)
    end
  end

  def nav_link_classes(path, base_classes: "")
    active = nav_active?(path)
    color_classes = active ? "text-coral" : "text-gray-500"
    "#{base_classes} #{color_classes}".strip
  end

  def sidebar_link(label, path, icon_name)
    active = nav_active?(path)
    classes = if active
      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-red-50 text-coral"
    else
      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-coral transition-colors"
    end

    link_to path, class: classes, "aria-current": (active ? "page" : nil) do
      render("icons/#{icon_name}") + content_tag(:span, label)
    end
  end
end
