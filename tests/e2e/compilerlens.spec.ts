import { test, expect } from "@playwright/test";

test.describe("CompilerLens E2E Test Suite", () => {
  test("loads landing page with hero, pipeline grid, and CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/CompilerLens/i);
    await expect(page.locator("h1")).toContainText("Demystify Compilers");
    await expect(page.getByRole("link", { name: /Open Interactive Studio/i })).toBeVisible();
  });

  test("navigates to playground and renders compiler workspace", async ({ page }) => {
    await page.goto("/playground");
    await expect(page.getByText("MiniLang Editor")).toBeVisible();
    await expect(page.getByRole("button", { name: /Compile/i })).toBeVisible();
  });

  test("switches tabs in playground workspace", async ({ page }) => {
    await page.goto("/playground");
    const tokensTab = page.getByRole("button", { name: "Tokens" });
    await tokensTab.click();
    await expect(page.getByText("Tokens (")).toBeVisible();

    const tacTab = page.getByRole("button", { name: "TAC IR" });
    await tacTab.click();
    await expect(page.getByText("Three-Address Code (TAC)")).toBeVisible();
  });

  test("navigates to Grammar Lab and displays FIRST/FOLLOW sets", async ({ page }) => {
    await page.goto("/grammar-lab");
    await expect(page.locator("h1")).toContainText("FIRST & FOLLOW Sets");
    await expect(page.getByText("LL(1) Valid Grammar")).toBeVisible();
  });

  test("navigates to Learning Hub and views lessons", async ({ page }) => {
    await page.goto("/learn");
    await expect(page.locator("h1")).toContainText("Interactive Course & Quizzes");
    await expect(page.getByText("01. Lexical Analysis & Tokenization")).toBeVisible();
  });
});
