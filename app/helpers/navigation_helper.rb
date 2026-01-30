module NavigationHelper
  def nav_active?(path)
    current_page?(path)
  end

  def nav_link_classes(path, base_classes: "")
    active = nav_active?(path)
    color_classes = active ? "text-coral" : "text-gray-500"
    "#{base_classes} #{color_classes}".strip
  end
end
