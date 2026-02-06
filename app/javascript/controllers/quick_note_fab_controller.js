import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["modal"]

  open() {
    this.modalTarget.classList.remove("hidden")
    this.modalTarget.classList.add("flex")
    document.body.classList.add("overflow-hidden")

    const textarea = this.modalTarget.querySelector("textarea")
    if (textarea) {
      textarea.focus()
    }
  }

  close() {
    this.modalTarget.classList.add("hidden")
    this.modalTarget.classList.remove("flex")
    document.body.classList.remove("overflow-hidden")
  }

  backdropClick(event) {
    if (event.target === this.modalTarget) {
      this.close()
    }
  }

  handleKeydown(event) {
    if (event.key === "Escape") {
      this.close()
    }
  }
}
