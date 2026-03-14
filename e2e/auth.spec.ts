import { expect, test } from "@playwright/test"

const providerEmail =
  process.env.HEALTHFLOW_PROVIDER_EMAIL ?? "dr.sharma@healthflow.com"
const providerPassword =
  process.env.HEALTHFLOW_PROVIDER_PASSWORD ?? "TestPass123"
const patientEmail =
  process.env.HEALTHFLOW_PATIENT_EMAIL ?? "patient1@healthflow.com"
const patientPassword =
  process.env.HEALTHFLOW_PATIENT_PASSWORD ?? "TestPass123"

test("login page validates required fields", async ({ page }) => {
  await page.goto("/login")

  await page.getByRole("button", { name: "Sign In" }).click()

  await expect(page.getByText("Email is required")).toBeVisible()
  await expect(page.getByText("Password is required")).toBeVisible()
})

test("register page switches between patient and provider roles", async ({ page }) => {
  await page.goto("/register")

  await page.getByRole("button", { name: /i am a provider/i }).click()
  await expect(page.getByLabel("Specialty")).toBeVisible()
  await expect(page.getByRole("button", { name: "Create Provider Account" })).toBeVisible()

  await page.getByRole("button", { name: /i am a patient/i }).click()
  await expect(page.getByLabel("Date of Birth")).toBeVisible()
  await expect(page.getByRole("button", { name: "Create Patient Account" })).toBeVisible()
})

test("provider can sign in and reach the dashboard", async ({ page }) => {
  await page.goto("/login")

  await page.locator("#login-email").fill(providerEmail)
  await page.locator("#login-password").fill(providerPassword)
  await page.getByRole("button", { name: "Sign In" }).click()

  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByText(/welcome back/i)).toBeVisible()
  await expect(
    page.getByRole("heading", { exact: true, name: "Today's Queue" })
  ).toBeVisible()
})

test("patient can sign in and reach the portal", async ({ page }) => {
  await page.goto("/login")

  await page.locator("#login-email").fill(patientEmail)
  await page.locator("#login-password").fill(patientPassword)
  await page.getByRole("button", { name: "Sign In" }).click()

  await expect(page).toHaveURL(/\/portal$/)
  await expect(page.getByText("Patient portal", { exact: true })).toBeVisible()
  await expect(page.getByText("Signed Records", { exact: true })).toBeVisible()
})
