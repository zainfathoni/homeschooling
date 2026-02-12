import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["textInput", "voiceInput", "photoInput", "videoInput", "typeButton", "typeField"]
  static values = { type: { type: String, default: "text" } }

  connect() {
    this.updateInputs()
  }

  select(event) {
    this.typeValue = event.currentTarget.dataset.type
  }

  typeValueChanged() {
    this.updateInputs()
  }

  updateInputs() {
    // Update hidden field
    if (this.hasTypeFieldTarget) {
      this.typeFieldTarget.value = this.typeValue
    }

    // Update button states
    this.typeButtonTargets.forEach(button => {
      const isActive = button.dataset.type === this.typeValue
      button.classList.toggle("bg-coral", isActive)
      button.classList.toggle("text-white", isActive)
      button.classList.toggle("bg-gray-100", !isActive)
      button.classList.toggle("text-gray-700", !isActive)
    })

    // Show/hide inputs and disable hidden inputs to prevent form submission conflicts
    this.toggleSection(this.textInputTarget, this.typeValue === "text")
    this.toggleSection(this.voiceInputTarget, this.typeValue === "voice")
    this.toggleSection(this.photoInputTarget, this.typeValue === "photo")
    this.toggleSection(this.videoInputTarget, this.typeValue === "video")
  }

  toggleSection(section, isActive) {
    if (!section) return

    section.classList.toggle("hidden", !isActive)
    // Disable inputs in hidden sections to prevent them from being submitted
    section.querySelectorAll("input, textarea").forEach(input => {
      input.disabled = !isActive
    })
  }
}
