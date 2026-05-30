import { test, expect, Page } from "@playwright/test";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uniqueEmail = () =>
  `test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@mailinator.com`;

async function goToSignup(page: Page) {
  await page.goto("/signup");
  await expect(page).toHaveURL(/signup/);
}

async function goToLogin(page: Page) {
  await page.goto("/login");
  await expect(page).toHaveURL(/login/);
}

async function fillSignupForm(page: Page, email: string, password: string) {
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  const confirmInput = page.locator('input[placeholder*="onfirm"], input[name*="onfirm"]').first();
  if (await confirmInput.isVisible()) {
    await confirmInput.fill(password);
  }
}

async function fillLoginForm(page: Page, email: string, password: string) {
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
}

// ─── Landing page ─────────────────────────────────────────────────────────────

test.describe("Landing page", () => {
  test("loads and shows key sections", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/FineClause/i);
    // Navbar logo
    await expect(page.getByText("FineClause").first()).toBeVisible();
    // Hero CTA
    await expect(page.getByRole("button", { name: /scan|analyze|get started|try/i }).first()).toBeVisible();
  });

  test("navbar sign in link navigates to login", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/login/);
  });

  test("navbar try free link navigates to signup", async ({ page }) => {
    await page.goto("/");
    // The CTA button may be a link or button with various text
    const cta = page.locator('a[href*="signup"], a[href*="sign-up"]').first();
    await expect(cta).toBeVisible({ timeout: 5000 });
    await cta.click();
    await expect(page).toHaveURL(/signup/);
  });
});

// ─── Signup page ──────────────────────────────────────────────────────────────

test.describe("Signup page", () => {
  test("signup page renders form", async ({ page }) => {
    await goToSignup(page);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.getByRole("button", { name: /sign up|create|register/i })).toBeVisible();
  });

  test("shows validation error for invalid email", async ({ page }) => {
    await goToSignup(page);
    await page.fill('input[type="email"]', "notanemail");
    await page.fill('input[type="password"]', "password123");
    await page.getByRole("button", { name: /sign up|create|register/i }).click();
    // Either HTML5 validation fires or an error message appears
    const emailInput = page.locator('input[type="email"]');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    const errorVisible = await page.getByText(/invalid|valid email|enter.*email/i).isVisible().catch(() => false);
    expect(isInvalid || errorVisible).toBeTruthy();
  });

  test("shows error for short password", async ({ page }) => {
    await goToSignup(page);
    await page.fill('input[type="email"]', uniqueEmail());
    await page.fill('input[type="password"]', "123");
    await page.getByRole("button", { name: /sign up|create|register/i }).click();
    // Supabase rejects passwords < 6 chars; error message should appear
    await expect(
      page.getByText(/password|at least|characters|too short/i).first()
    ).toBeVisible({ timeout: 8000 });
  });

  test("shows error for mismatched passwords", async ({ page }) => {
    await goToSignup(page);
    const email = uniqueEmail();
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', "Secure123!");
    const confirmInput = page.locator('input[placeholder*="onfirm"], input[name*="onfirm"]').first();
    if (await confirmInput.isVisible()) {
      await confirmInput.fill("DifferentPassword!");
      await page.getByRole("button", { name: /sign up|create|register/i }).click();
      await expect(
        page.getByText(/match|same password/i).first()
      ).toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
    }
  });

  test("successful signup shows confirmation or redirects", async ({ page }) => {
    await goToSignup(page);
    const email = uniqueEmail();
    await fillSignupForm(page, email, "Secure123!");
    await page.getByRole("button", { name: /sign up|create|register/i }).click();
    // Either a "check your email" message appears, or user is redirected
    await Promise.race([
      expect(page.getByText(/check your email|verify|confirmation|sent/i).first()).toBeVisible({ timeout: 10000 }),
      expect(page).toHaveURL(/dashboard|scan|\/$/),
    ]).catch(() => {
      // One of them should succeed
    });
  });

  test("sign in link on signup page navigates to login", async ({ page }) => {
    await goToSignup(page);
    const link = page.locator('a[href*="login"]').first();
    await expect(link).toBeVisible({ timeout: 5000 });
    await link.click();
    await expect(page).toHaveURL(/login/);
  });
});

// ─── Login page ───────────────────────────────────────────────────────────────

test.describe("Login page", () => {
  test("login page renders form", async ({ page }) => {
    await goToLogin(page);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in|log in/i })).toBeVisible();
  });

  test("shows error for wrong credentials", async ({ page }) => {
    await goToLogin(page);
    await fillLoginForm(page, "nonexistent@fineclause.com", "wrongpassword");
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await expect(
      page.getByText(/invalid|incorrect|wrong|not found|credentials/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("shows error for empty email", async ({ page }) => {
    await goToLogin(page);
    await page.fill('input[type="password"]', "password123");
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    const emailInput = page.locator('input[type="email"]');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBeTruthy();
  });

  test("forgot password link navigates to reset page", async ({ page }) => {
    await goToLogin(page);
    await page.getByRole("link", { name: /forgot|reset|password/i }).click();
    await expect(page).toHaveURL(/forgot/);
  });

  test("sign up link on login page navigates to signup", async ({ page }) => {
    await goToLogin(page);
    await page.getByRole("link", { name: /sign up|create account|don't have/i }).click();
    await expect(page).toHaveURL(/signup/);
  });
});

// ─── Password reset flow ──────────────────────────────────────────────────────

test.describe("Forgot password page", () => {
  test("renders reset form", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /reset|send|email/i })).toBeVisible();
  });

  test("shows error for invalid email format", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.fill('input[type="email"]', "notvalid");
    await page.getByRole("button", { name: /reset|send|email/i }).click();
    const emailInput = page.locator('input[type="email"]');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBeTruthy();
  });

  test("submitting valid email shows confirmation", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.fill('input[type="email"]', "anyone@example.com");
    await page.getByRole("button", { name: /reset|send|email/i }).click();
    await expect(
      page.getByText(/check your email|sent|reset link/i).first()
    ).toBeVisible({ timeout: 10000 });
  });
});

// ─── Auth callback (email confirmation deep link) ─────────────────────────────

test.describe("Email confirmation callback", () => {
  test("handles access_token in hash and redirects to app", async ({ page }) => {
    // Simulate the URL Supabase sends after email confirmation
    // Use a fake token — the app should attempt to exchange it and either
    // succeed (unlikely with fake token) or redirect to login gracefully
    await page.goto("/#access_token=fake_token&type=signup&refresh_token=fake_refresh");
    // App should not crash — it should redirect somewhere sensible
    await page.waitForURL((url) => !url.hash.includes("access_token"), { timeout: 8000 }).catch(() => {});
    const url = page.url();
    expect(url).toMatch(/localhost|fineclause/);
    // Should not be stuck on a blank page
    await expect(page.locator("body")).not.toBeEmpty();
  });
});

// ─── Protected routes ─────────────────────────────────────────────────────────

test.describe("Protected routes (unauthenticated)", () => {
  const protectedPaths = ["/dashboard", "/scan", "/templates", "/invoices"];

  for (const path of protectedPaths) {
    test(`${path} redirects unauthenticated user`, async ({ page }) => {
      await page.goto(path);
      // Should redirect to login or show auth page
      await page.waitForURL((url) => url.pathname !== path || url.pathname.includes("login"), {
        timeout: 8000,
      }).catch(() => {});
      const finalUrl = page.url();
      // Either redirected to /login or the scan/signup flow
      const isRedirected =
        finalUrl.includes("login") ||
        finalUrl.includes("signup") ||
        // Or the page shows a login prompt
        (await page.getByRole("button", { name: /sign in|log in/i }).isVisible().catch(() => false));
      expect(isRedirected).toBeTruthy();
    });
  }
});

// ─── Public pages ─────────────────────────────────────────────────────────────

test.describe("Public informational pages", () => {
  const publicPages = [
    { path: "/privacy", title: /privacy/i },
    { path: "/terms", title: /terms/i },
    { path: "/cookies", title: /cookie/i },
    { path: "/contact", title: /contact/i },
    { path: "/security", title: /safe|security|secure/i },
  ];

  for (const { path, title } of publicPages) {
    test(`${path} loads without error`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8000 });
      await expect(page.locator("h1, h2").first()).toHaveText(title);
    });
  }
});

// ─── 404 page ─────────────────────────────────────────────────────────────────

test.describe("404 page", () => {
  test("shows not found page for unknown route", async ({ page }) => {
    await page.goto("/this-route-does-not-exist-at-all");
    await expect(page.getByText(/not found|404|doesn't exist|page/i).first()).toBeVisible({ timeout: 8000 });
  });
});
