module NavigationHelper
  def nav_active?(path)
    current_page?(path)
  end

  def nav_link_classes(path, base_classes: "")
    active = nav_active?(path)
    color_classes = active ? "text-coral" : "text-gray-500"
    "#{base_classes} #{color_classes}".strip
  end

  def sidebar_link(label, path, icon_svg)
    active = nav_active?(path)
    classes = if active
      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-red-50 text-coral"
    else
      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-coral transition-colors"
    end

    link_to path, class: classes, "aria-current": (active ? "page" : nil) do
      icon_svg + content_tag(:span, label)
    end
  end

  def today_icon
    content_tag(:svg, class: "w-5 h-5 shrink-0", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", "stroke-width": "1.5") do
      tag.path("stroke-linecap": "round", "stroke-linejoin": "round", d: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5")
    end
  end

  def week_icon
    content_tag(:svg, class: "w-5 h-5 shrink-0", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", "stroke-width": "1.5") do
      tag.path("stroke-linecap": "round", "stroke-linejoin": "round", d: "M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z")
    end
  end

  def notes_icon
    content_tag(:svg, class: "w-5 h-5 shrink-0", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", "stroke-width": "1.5") do
      tag.path("stroke-linecap": "round", "stroke-linejoin": "round", d: "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z")
    end
  end

  def students_icon
    content_tag(:svg, class: "w-5 h-5 shrink-0", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", "stroke-width": "1.5") do
      tag.path("stroke-linecap": "round", "stroke-linejoin": "round", d: "M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z")
    end
  end

  def reports_icon
    content_tag(:svg, class: "w-5 h-5 shrink-0", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", "stroke-width": "1.5") do
      tag.path("stroke-linecap": "round", "stroke-linejoin": "round", d: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z")
    end
  end

  def settings_icon
    content_tag(:svg, class: "w-5 h-5 shrink-0", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", "stroke-width": "1.5") do
      safe_join([
        tag.path("stroke-linecap": "round", "stroke-linejoin": "round", d: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"),
        tag.path("stroke-linecap": "round", "stroke-linejoin": "round", d: "M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z")
      ])
    end
  end
end
