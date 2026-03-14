import { expect, test, type Page } from "@playwright/test"

const providerEmail =
  process.env.HEALTHFLOW_PROVIDER_EMAIL ?? "dr.sharma@healthflow.com"
const providerPassword =
  process.env.HEALTHFLOW_PROVIDER_PASSWORD ?? "TestPass123"
const patientEmail =
  process.env.HEALTHFLOW_PATIENT_EMAIL ?? "patient1@healthflow.com"
const patientPassword =
  process.env.HEALTHFLOW_PATIENT_PASSWORD ?? "TestPass123"

async function login(page: Page, email: string, password: string) {
  await page.goto("/login")
  await page.locator("#login-email").fill(email)
  await page.locator("#login-password").fill(password)
  await page.getByRole("button", { name: "Sign In" }).click()
}

test("provider core routes load and consultation is reachable", async ({ page }) => {
  await login(page, providerEmail, providerPassword)
  await expect(page).toHaveURL(/\/dashboard$/)

  await page.goto("/patients")
  await expect(page.getByRole("button", { name: "Add Patient" })).toBeVisible()
  await expect(page.getByText(/showing \d+ of \d+ patients/i)).toBeVisible()

  await page.goto("/appointments")
  await expect(page.getByPlaceholder("Search appointments")).toBeVisible()
  await expect(
    page.getByText("Manage visit scheduling, status, and cancellations in one place.")
  ).toBeVisible()

  const joinCallLink = page.getByRole("link", { name: "Join Call" }).first()
  await expect(joinCallLink).toBeVisible()
  await joinCallLink.click()
  await expect(page).toHaveURL(/\/consultation\//)
  await expect(
    page.getByRole("heading", { name: "Prepare your device before joining" })
  ).toBeVisible()

  await page.goto("/notes")
  await expect(page.getByRole("button", { name: "Create Note" })).toBeVisible()
  await expect(
    page.getByText("Review and complete SOAP notes across your patient roster.")
  ).toBeVisible()

  await page.goto("/messages")
  await expect(page.getByText("Secure inbox", { exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: /send secure message/i })).toBeVisible()
})

test("patient portal routes load after sign-in", async ({ page }) => {
  await login(page, patientEmail, patientPassword)
  await expect(page).toHaveURL(/\/portal$/)

  await page.goto("/portal/appointments")
  await expect(
    page.getByText("Upcoming and historical appointments available in your account.")
  ).toBeVisible()

  await page.goto("/portal/records")
  await expect(
    page.getByText("Signed clinical notes and diagnoses shared with your account.")
  ).toBeVisible()

  await page.goto("/portal/messages")
  await expect(page.getByText("Secure inbox", { exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: /send secure message/i })).toBeVisible()
})
