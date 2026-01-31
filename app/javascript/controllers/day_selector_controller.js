import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["day"]
  static classes = ["selected", "unselected"]

  select(event) {
    // Update visual state for all day buttons
    this.dayTargets.forEach(day => {
      if (day === event.currentTarget) {
        day.classList.remove(...this.unselectedClasses)
        day.classList.add(...this.selectedClasses)
      } else {
        day.classList.remove(...this.selectedClasses)
        day.classList.add(...this.unselectedClasses)
      }
    })
  }
}
