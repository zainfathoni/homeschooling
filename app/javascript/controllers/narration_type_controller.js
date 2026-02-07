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

    // Show/hide inputs
    if (this.hasTextInputTarget) {
      this.textInputTarget.classList.toggle("hidden", this.typeValue !== "text")
    }
    if (this.hasVoiceInputTarget) {
      this.voiceInputTarget.classList.toggle("hidden", this.typeValue !== "voice")
    }
    if (this.hasPhotoInputTarget) {
      this.photoInputTarget.classList.toggle("hidden", this.typeValue !== "photo")
    }
    if (this.hasVideoInputTarget) {
      this.videoInputTarget.classList.toggle("hidden", this.typeValue !== "video")
    }
  }
}
