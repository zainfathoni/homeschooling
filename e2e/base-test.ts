import { test as base, expect } from '@playwright/test'

export interface Fixtures {
  noscript: boolean
}

export const test = base.extend<Fixtures>({
  noscript: [false, { option: true }],
})

export { expect }
