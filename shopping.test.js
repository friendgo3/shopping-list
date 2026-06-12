const { test, expect } = require('@playwright/test');
const path = require('path');

const FILE_URL = `file://${path.resolve(__dirname, 'index.html')}`;

test.beforeEach(async ({ page }) => {
  await page.goto(FILE_URL);
  // localStorage 초기화
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

// ─── 아이템 추가 ─────────────────────────────────────────────

test('버튼 클릭으로 아이템 추가', async ({ page }) => {
  await page.fill('#itemInput', '사과');
  await page.click('button:has-text("추가")');

  const items = page.locator('li');
  await expect(items).toHaveCount(1);
  await expect(items.first().locator('.item-text')).toHaveText('사과');
});

test('Enter 키로 아이템 추가', async ({ page }) => {
  await page.fill('#itemInput', '바나나');
  await page.press('#itemInput', 'Enter');

  await expect(page.locator('li')).toHaveCount(1);
  await expect(page.locator('.item-text').first()).toHaveText('바나나');
});

test('여러 아이템 추가', async ({ page }) => {
  for (const name of ['우유', '빵', '계란']) {
    await page.fill('#itemInput', name);
    await page.press('#itemInput', 'Enter');
  }
  await expect(page.locator('li')).toHaveCount(3);
});

test('빈 문자열은 추가되지 않음', async ({ page }) => {
  await page.fill('#itemInput', '   ');
  await page.click('button:has-text("추가")');
  await expect(page.locator('li')).toHaveCount(0);
});

test('추가 후 입력창이 비워짐', async ({ page }) => {
  await page.fill('#itemInput', '주스');
  await page.press('#itemInput', 'Enter');
  await expect(page.locator('#itemInput')).toHaveValue('');
});

// ─── 아이템 체크 ─────────────────────────────────────────────

test('클릭하면 아이템이 완료 상태로 전환', async ({ page }) => {
  await page.fill('#itemInput', '콜라');
  await page.press('#itemInput', 'Enter');

  const item = page.locator('li').first();
  await expect(item).not.toHaveClass(/done/);
  await item.click();
  await expect(item).toHaveClass(/done/);
});

test('완료 아이템을 다시 클릭하면 미완료로 복귀', async ({ page }) => {
  await page.fill('#itemInput', '물');
  await page.press('#itemInput', 'Enter');

  const item = page.locator('li').first();
  await item.click();
  await expect(item).toHaveClass(/done/);
  await item.click();
  await expect(item).not.toHaveClass(/done/);
});

test('완료 항목은 취소선 스타일 적용', async ({ page }) => {
  await page.fill('#itemInput', '라면');
  await page.press('#itemInput', 'Enter');

  const item = page.locator('li').first();
  await item.click();
  const textDecoration = await item.locator('.item-text').evaluate(
    el => getComputedStyle(el).textDecoration
  );
  expect(textDecoration).toContain('line-through');
});

// ─── 아이템 삭제 ─────────────────────────────────────────────

test('삭제 버튼으로 아이템 제거', async ({ page }) => {
  await page.fill('#itemInput', '과자');
  await page.press('#itemInput', 'Enter');

  const item = page.locator('li').first();
  await item.hover();
  await item.locator('.delete-btn').click();

  await expect(page.locator('li')).toHaveCount(0);
});

test('여러 아이템 중 특정 아이템만 삭제', async ({ page }) => {
  for (const name of ['첫번째', '두번째', '세번째']) {
    await page.fill('#itemInput', name);
    await page.press('#itemInput', 'Enter');
  }
  await expect(page.locator('li')).toHaveCount(3);

  // 가장 최근 추가된 항목(맨 위) 삭제 — unshift로 추가되므로 첫 번째가 '세번째'
  const firstItem = page.locator('li').first();
  await firstItem.hover();
  await firstItem.locator('.delete-btn').click();

  await expect(page.locator('li')).toHaveCount(2);
  // '세번째' 항목이 사라졌는지 확인
  await expect(page.locator('.item-text').first()).not.toHaveText('세번째');
});

// ─── 완료 항목 일괄 삭제 ─────────────────────────────────────

test('완료 항목 일괄 삭제', async ({ page }) => {
  for (const name of ['항목A', '항목B', '항목C']) {
    await page.fill('#itemInput', name);
    await page.press('#itemInput', 'Enter');
  }

  // 첫 번째와 두 번째 항목 체크
  await page.locator('li').nth(0).click();
  await page.locator('li').nth(1).click();

  await page.click('.clear-btn');

  // 완료 2개 삭제 → 1개 남음
  await expect(page.locator('li')).toHaveCount(1);
  await expect(page.locator('li.done')).toHaveCount(0);
});

// ─── 통계 표시 ───────────────────────────────────────────────

test('통계가 아이템 수와 완료 수를 정확히 표시', async ({ page }) => {
  for (const name of ['A', 'B', 'C']) {
    await page.fill('#itemInput', name);
    await page.press('#itemInput', 'Enter');
  }
  await page.locator('li').first().click(); // 1개 완료

  const stats = page.locator('#stats');
  await expect(stats).toContainText('3');
  await expect(stats).toContainText('1');
});

// ─── 빈 목록 안내 메시지 ─────────────────────────────────────

test('아이템 없을 때 안내 메시지 표시', async ({ page }) => {
  await expect(page.locator('#empty')).toBeVisible();
});

test('아이템 추가 시 안내 메시지 숨김', async ({ page }) => {
  await page.fill('#itemInput', '테스트');
  await page.press('#itemInput', 'Enter');
  await expect(page.locator('#empty')).toBeHidden();
});

// ─── localStorage 영속성 ─────────────────────────────────────

test('새로고침 후에도 데이터 유지', async ({ page }) => {
  await page.fill('#itemInput', '저장테스트');
  await page.press('#itemInput', 'Enter');
  await page.locator('li').first().click(); // 완료 상태로

  await page.reload();

  await expect(page.locator('li')).toHaveCount(1);
  await expect(page.locator('.item-text').first()).toHaveText('저장테스트');
  await expect(page.locator('li').first()).toHaveClass(/done/);
});
