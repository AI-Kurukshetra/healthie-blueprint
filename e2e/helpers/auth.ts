import { expect, type Page } from "@playwright/test"

const providerEmail =
  process.env.HEALTHFLOW_PROVIDER_EMAIL ?? "dr.sharma@healthflow.com"
const providerPassword =
  process.env.HEALTHFLOW_PROVIDER_PASSWORD ?? "TestPass123"
const patientEmail =
  process.env.HEALTHFLOW_PATIENT_EMAIL ?? "patient1@healthflow.com"
const patientPassword =
  process.env.HEALTHFLOW_PATIENT_PASSWORD ?? "TestPass123"

async function login(page: Page, email: string, password: string, expectedUrl: RegExp) {
  await page.goto("/login")
  await page.locator("#login-email").fill(email)
  await page.locator("#login-password").fill(password)
  await page.getByRole("button", { name: "Sign In" }).click()
  await expect(page).toHaveURL(expectedUrl)
}

export async function loginAsProvider(page: Page) {
  await login(page, providerEmail, providerPassword, /\/dashboard$/)
}

export async function loginAsPatient(page: Page) {
  await login(page, patientEmail, patientPassword, /\/portal$/)
}
