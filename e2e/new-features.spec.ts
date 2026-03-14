import { expect, test } from "@playwright/test"

import { loginAsPatient, loginAsProvider } from "./helpers/auth"

test("provider dashboard shows analytics charts", async ({ page }) => {
  await loginAsProvider(page)

  await expect(page.getByText("Practice Analytics")).toBeVisible()
  await expect(page.getByText("Appointments This Week")).toBeVisible()
  await expect(page.getByText("Patients by Condition")).toBeVisible()
})

test("provider can open timeline, care team, and care plan routes from patient detail", async ({
  page,
}) => {
  await loginAsProvider(page)

  await page.goto("/patients")
  await page.getByRole("link", { name: "View" }).first().click()

  await page.getByRole("tab", { name: "Timeline" }).click()
  await page.getByRole("link", { name: "Open Timeline" }).click()
  await expect(page).toHaveURL(/\/patients\/.+\/timeline$/)
  await expect(page.getByText(/timeline for/i)).toBeVisible()

  await page.goBack()
  await page.getByRole("tab", { name: "Care Team" }).click()
  await page.getByRole("link", { name: "Manage Care Team" }).click()
  await expect(page).toHaveURL(/\/patients\/.+\/care-team$/)
  await expect(page.getByText(/care team for/i)).toBeVisible()

  await page.goBack()
  await page.getByRole("tab", { name: "Care Plan" }).click()
  await page.getByRole("link", { name: "Open Care Plan" }).click()
  await expect(page).toHaveURL(/\/patients\/.+\/care-plan$/)
  await expect(page.getByText(/care plan for/i)).toBeVisible()
  await expect(page.getByRole("button", { name: /save draft/i })).toBeVisible()
})

test("patient portal exposes active care plan surface", async ({ page }) => {
  await loginAsPatient(page)

  await page.getByRole("link", { name: /my care plan/i }).click()
  await expect(page).toHaveURL(/\/portal\/care-plan$/)
  await expect(
    page.getByRole("heading", { name: /my care plan|no care plan yet/i })
  ).toBeVisible()
})
