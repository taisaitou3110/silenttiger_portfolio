import { test, expect } from '@playwright/test';

test.describe('Rocket Game', () => {
  // 各テストの前に、ゲームページにアクセスし、レベルを選択する
  test.beforeEach(async ({ page }) => {
    // baseURLが設定されているので、相対パスでアクセス
    await page.goto('/rocket-game');
    
    // ゲームのメニューが表示されるのを待つ
    await expect(page.getByRole('heading', { name: /ROCKET SIM v1.6/i })).toBeVisible();
    
    // レベル1を選択
    await page.getByRole('button', { name: /Lv.1: 理想の放物線/i }).click();

    // ゲーム画面が表示されるのを待つ
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should display current trajectory on first launch', async ({ page }) => {
    const canvas = page.locator('canvas');

    // 発射前のスクリーンショットを撮り、期待通りか確認
    await expect(canvas).toHaveScreenshot('rocket-game-before-launch.png', { maxDiffPixels: 100, animations: 'disabled' });

    // 発射ボタンをクリック
    await page.getByRole('button', { name: /LAUNCH/i }).click();

    // ロケットが少し飛ぶのを待つ
    await page.waitForTimeout(500);
  });

  test('should display past and current trajectories on second launch', async ({ page }) => {
    const canvas = page.locator('canvas');

    // --- 1回目の発射 ---
    await page.getByRole('button', { name: /LAUNCH/i }).click();
    // 着地するまで待つ (結果表示が出るまで)
    await expect(page.getByText(/CLICK TO RETRY/)).toBeVisible({ timeout: 10000 });
    
    // 1回目の着地後のスクリーンショットを撮り、過去の軌跡が1本描かれていることを確認
    await expect(canvas).toHaveScreenshot('rocket-game-first-landed.png', { maxDiffPixels: 100, animations: 'disabled' });

    // 結果表示をクリックして消す
    await page.getByText(/CLICK TO RETRY/).click();
    
    // --- 2回目の発射 (少しパラメータを変える) ---
    const angleSlider = page.locator('input[type="range"]').last();
    const boundingBox = await angleSlider.boundingBox();
    if (boundingBox) {
      await page.mouse.move(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(boundingBox.x + boundingBox.width * 0.75, boundingBox.y + boundingBox.height / 2);
      await page.mouse.up();
    }

    await page.getByRole('button', { name: /LAUNCH/i }).click();
    
    // 2回目の飛行中に少し待つ
    await page.waitForTimeout(500);
  });

  test('should animate trajectory in real-time', async ({ page }) => {
    const canvas = page.locator('canvas');

    // 発射
    await page.getByRole('button', { name: /LAUNCH/i }).click();

    // 100ms待機
    await page.waitForTimeout(100);
    const screenshot1 = await canvas.screenshot();

    // さらに100ms待機
    await page.waitForTimeout(100);
    const screenshot2 = await canvas.screenshot();

    // 2つのスクリーンショットが異なることを確認（＝アニメーションしている）
    expect(screenshot1).not.toEqual(screenshot2);
  });

  test('should display launch history', async ({ page }) => {
    // 1回目の試行 (MISSを想定)
    await page.getByRole('button', { name: /LAUNCH/i }).click();
    await expect(page.getByText(/CLICK TO RETRY/)).toBeVisible({ timeout: 10000 });
    
    // 結果のテキストを確認し、クリックして消す
    const firstAttemptResultText = await page.locator('li').first().locator('p').first().textContent();
    expect(firstAttemptResultText).toContain('💥 MISS:');
    
    await page.getByText(/CLICK TO RETRY/).click();
    
    await expect(page.locator('li')).toHaveCount(1); // 履歴が1件追加されたことを確認
    await expect(page.locator('li').first()).toContainText('P: 0.50'); // デフォルト値
    await expect(page.locator('li').first()).toContainText('A: 45°');   // デフォルト値
    await expect(page.locator('li').first()).toContainText('D:'); // 飛距離が含まれていることを確認

    // 2回目の試行 (パラメータを変更してMISSを想定)
    const pressureSlider = page.locator('input[type="range"]').first();
    await pressureSlider.fill('0.7'); // 圧力を変更

    await page.getByRole('button', { name: /LAUNCH/i }).click();
    await expect(page.getByText(/CLICK TO RETRY/)).toBeVisible({ timeout: 10000 });
    
    // 結果のテキストを確認し、クリックして消す
    const secondAttemptResultText = await page.locator('li').nth(1).locator('p').first().textContent();
    expect(secondAttemptResultText).toContain('💥 MISS:');

    await page.getByText(/CLICK TO RETRY/).click();

    await expect(page.locator('li')).toHaveCount(2); // 履歴が2件になったことを確認
    await expect(page.locator('li').nth(1)).toContainText('P: 0.50');
    await expect(page.locator('li').nth(1)).toContainText('A: 45°');
    await expect(page.locator('li').nth(1)).toContainText('D:');
  });

  test('should show GOAL message with correct parameters', async ({ page }) => {
    // レベル1 (目標: 1000m) でゴールを狙う
    const pressureSlider = page.locator('input[type="range"]').first();
    const angleSlider = page.locator('input[type="range"]').last();

    await pressureSlider.fill('0.49');
    await angleSlider.fill('45');

    // 発射
    await page.getByRole('button', { name: /LAUNCH/i }).click();

    // ゴールメッセージが表示されるのを待つ
    await expect(page.getByRole('heading', { name: /🎉 GOAL!/ })).toBeVisible({ timeout: 10000 });
    
    // 履歴にもGOALが表示されることを確認
    const historyText = await page.locator('li').first().textContent();
    expect(historyText).toContain('🎉 GOAL!');
    expect(historyText).toContain('P: 0.49');
    expect(historyText).toContain('A: 45°');
  });

  test('should display real-time status during flight', async ({ page }) => {
    // Launchボタンをクリック
    await page.getByRole('button', { name: /LAUNCH/i }).click();

    // リアルタイムステータス表示エリアが表示されていることを確認
    const statusDisplay = page.locator('p', { hasText: 'Altitude:' }).first().locator('..'); // Altitudeを持つpの親要素
    await expect(statusDisplay).toBeVisible();

    // Altitude, Velocity, Distance の値が表示されていることを確認 (0以外)
    await expect(statusDisplay).toContainText(/Altitude: [1-9]\d*m/); // 0m以外
    await expect(statusDisplay).toContainText(/Velocity: [1-9]\d*m\/s/); // 0m/s以外
    await expect(statusDisplay).toContainText(/Distance: [1-9]\d*m/); // 0m以外

    // ロケットが着地するまで待つ
    await expect(page.getByText(/CLICK TO RETRY/)).toBeVisible({ timeout: 10000 });

    // 着地後、リアルタイムステータス表示エリアが非表示になることを確認
    await expect(statusDisplay).not.toBeVisible();
  });

  test('should navigate to next level after GOAL', async ({ page }) => {
    // ゴールするパラメータで発射
    await page.locator('input[type="range"]').first().fill('0.49'); // Pressure
    await page.locator('input[type="range"]').last().fill('45');   // Angle
    await page.getByRole('button', { name: /LAUNCH/i }).click();

    // ゴールメッセージが表示されるのを待つ
    await expect(page.getByRole('heading', { name: /🎉 GOAL!/ })).toBeVisible({ timeout: 10000 });

    // 「次のレベルへ」ボタンをクリック
    await page.getByRole('button', { name: '次のレベルへ' }).click();

    // レベルが2に上がったことを確認 (Lv.2: 山を越えろ)
    await expect(page.getByRole('heading', { name: /Lv.2: 山を越えろ/i })).toBeVisible();
  });
});