import { test, expect } from '@playwright/test';

const requiredForLogin = ['E2E_LOGIN_EMAIL', 'E2E_LOGIN_PASSWORD'];
const requiredForAssessment = ['E2E_ASSESSMENT_URL'];

const missingVars = (keys) => keys.filter((k) => !process.env[k]);

const fillLeadForm = async (page) => {
  await page.getByTestId('result-name').fill(process.env.E2E_RESULT_NAME || 'Smoke Candidate');
  await page.getByTestId('result-email').fill(process.env.E2E_RESULT_EMAIL || 'smoke.candidate@example.com');
  await page.getByTestId('result-phone').fill(process.env.E2E_RESULT_PHONE || '+919999999999');
  await page.getByTestId('result-location').fill(process.env.E2E_RESULT_LOCATION || 'Ahmedabad, Gujarat');
};

test.describe('Real Smoke Flows', () => {
  test('login flow redirects to role dashboard', async ({ page }) => {
    const missing = missingVars(requiredForLogin);
    test.skip(missing.length > 0, `Missing env vars: ${missing.join(', ')}`);

    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();

    await page.getByTestId('login-email').fill(process.env.E2E_LOGIN_EMAIL);
    await page.getByTestId('login-password').fill(process.env.E2E_LOGIN_PASSWORD);

    await Promise.all([
      page.waitForURL(/\/(superadmin|company|branch|sales)\//, { timeout: 30000 }),
      page.getByTestId('login-submit').click(),
    ]);
  });

  test('assessment start -> submit -> result -> download flow', async ({ page }) => {
    const missing = missingVars(requiredForAssessment);
    test.skip(missing.length > 0, `Missing env vars: ${missing.join(', ')}`);

    await page.goto(process.env.E2E_ASSESSMENT_URL);
    await expect(page.getByRole('heading', { name: /popular exams/i })).toBeVisible();

    const startButton = page.locator('[data-testid^="start-assessment-"]').first();
    await expect(startButton).toBeVisible();
    await startButton.click();

    await page.waitForURL(/\/assessment\/test\//, { timeout: 45000 });

    await page.getByTestId('verify-hardware').click();
    await expect(page.getByTestId('start-exam')).toBeVisible({ timeout: 20000 });
    await page.getByTestId('start-exam').click();

    const questionCount = await page.locator('[data-testid^="question-nav-"]').count();
    expect(questionCount).toBeGreaterThan(0);

    for (let i = 0; i < questionCount; i += 1) {
      await page.getByTestId('answer-option-0').click();
      if (i === questionCount - 1) {
        await page.getByTestId('submit-exam').click();
      } else {
        await page.getByTestId('next-question').click();
      }
    }

    await page.waitForURL(/\/assessment\/result\//, { timeout: 45000 });
    await expect(page.getByTestId('result-score-screen')).toBeVisible();

    await page.getByTestId('register-result').click();
    await expect(page.getByTestId('result-form')).toBeVisible();
    await fillLeadForm(page);
    await page.getByTestId('generate-report').click();

    await expect(page.getByTestId('result-final-screen')).toBeVisible({ timeout: 30000 });

    const [certificateDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('download-certificate').click(),
    ]);
    expect(certificateDownload.suggestedFilename()).toContain('gitakshmi-certificate-');

    const [reportDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('download-report').click(),
    ]);
    expect(reportDownload.suggestedFilename()).toContain('gitakshmi-report-');
  });
});

