import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["radio", "scheduledDays", "pick1Options", "optionsList", "optionTemplate", "optionRow", "destroyField"]

  connect() {
    this.optionIndex = this.optionRowTargets.length
  }

  toggle() {
    const selectedType = this.radioTargets.find(radio => radio.checked)?.value

    this.scheduledDaysTarget.classList.toggle("hidden", selectedType !== "scheduled")
    this.pick1OptionsTarget.classList.toggle("hidden", selectedType !== "pick1")
  }

  addOption() {
    const template = this.optionTemplateTarget.innerHTML
    const newOption = template.replace(/NEW_INDEX/g, this.optionIndex++)
    this.optionsListTarget.insertAdjacentHTML("beforeend", newOption)
  }

  removeOption(event) {
    const row = event.target.closest("[data-subject-type-target='optionRow']")
    const destroyField = row.querySelector("[data-subject-type-target='destroyField']")
    
    if (destroyField && destroyField.name.includes("[id]")) {
      destroyField.value = "1"
      row.classList.add("hidden")
    } else {
      row.remove()
    }
  }
}
