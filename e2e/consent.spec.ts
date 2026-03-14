import { expect, test } from "@playwright/test"

const providerEmail =
  process.env.HEALTHFLOW_PROVIDER_EMAIL ?? "dr.sharma@healthflow.com"
const patientEmail =
  process.env.HEALTHFLOW_PATIENT_EMAIL ?? "patient1@healthflow.com"

test.describe("Consent - Register", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/register")
    await page.getByRole("button", { name: /i am a patient/i }).click()
  })

  test("patient registration shows consent checkboxes", async ({ page }) => {
    await expect(page.getByText(/consent to treatment/i)).toBeVisible()
    await expect(page.getByText(/telehealth consultations/i)).toBeVisible()
    await expect(page.getByText(/terms of service/i)).toBeVisible()
  })

  test("patient registration blocks submit without consent", async ({ page }) => {
    await page.getByLabel("Full Name").fill("Consent Test")
    await page.getByLabel("Email").fill(`consent_${Date.now()}@test.com`)
    await page.locator("#register-password").fill("Password1")
    await page.locator("#register-confirm-password").fill("Password1")
    await page.getByRole("button", { name: /create patient account/i }).click()

    await expect(page.getByText(/must accept all terms/i)).toBeVisible()
  })

  test("provider registration blocks reuse of an existing patient email", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /i am a provider/i }).click()

    await page.getByLabel("Full Name").fill("Dr. Conflict Check")
    await page.getByLabel("Email").fill(patientEmail)
    await page.locator("#register-password").fill("Password1")
    await page.locator("#register-confirm-password").fill("Password1")
    await page.getByLabel("Phone").fill("9876543210")
    await page.getByLabel("Specialty").fill("Cardiology")
    await page.getByLabel("License Number").fill("MH-2026-999")
    await page.getByLabel("License State").fill("Maharashtra")
    await page.getByRole("button", { name: /create provider account/i }).click()

    await expect(
      page.getByText(/already registered as a patient/i).first()
    ).toBeVisible()
  })

  test("patient registration blocks reuse of an existing provider email", async ({
    page,
  }) => {
    await page.getByLabel("Full Name").fill("Patient Conflict Check")
    await page.getByLabel("Email").fill(providerEmail)
    await page.locator("#register-password").fill("Password1")
    await page.locator("#register-confirm-password").fill("Password1")
    await page.locator("#register-phone").fill("9876543210")
    await page.locator("#register-dob").fill("1994-06-12")
    await page.getByText(/consent to treatment/i).click()
    await page.getByText(/telehealth consultations/i).click()
    await page.getByText(/terms of service/i).click()
    await page.getByRole("button", { name: /create patient account/i }).click()

    await expect(
      page.getByText(/already registered as a provider/i).first()
    ).toBeVisible()
  })
})
