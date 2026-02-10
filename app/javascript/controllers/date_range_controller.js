import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["startDate", "endDate"]

  preset(event) {
    const weeks = parseInt(event.currentTarget.dataset.weeks, 10)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - weeks * 7)

    this.startDateTarget.value = this.formatDate(startDate)
    this.endDateTarget.value = this.formatDate(endDate)
    this.element.requestSubmit()
  }

  formatDate(date) {
    return date.toISOString().split("T")[0]
  }
}
