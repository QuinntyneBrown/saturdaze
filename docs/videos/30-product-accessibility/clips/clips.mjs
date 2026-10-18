// Real Family-page recordings for video 30. The baseline and fix use the same
// seeded API profile; neither recording saves the open Likes and dislikes dialog.
export const config = {
  baseURL: process.env.SD_AFTER_APP_URL ?? 'http://localhost:4202',
  apiURL: process.env.SD_API_URL ?? 'http://localhost:5100',
  viewport: { width: 1408, height: 792 },
};

const baseline = process.env.SD_BEFORE_APP_URL ?? 'http://localhost:4201';

async function openDialog(t, baseURL) {
  await t.go(baseURL ? `${baseURL}/family` : '/family');
  const section = t.page.locator('sd-section').filter({ hasText: 'Likes and dislikes' });
  const duplicate = (await section.locator('.chip--leaf').first().innerText()).trim();
  if (!duplicate) throw new Error('The Family demo profile needs an existing Like for the duplicate demo');
  await t.click(section.getByRole('button', { name: 'Edit', exact: true }));
  const dialog = t.page.getByRole('dialog', { name: 'Likes and dislikes' });
  await dialog.waitFor();
  return { dialog, duplicate };
}

async function attemptDuplicates(t) {
  const { dialog, duplicate } = await openDialog(t);
  const likes = dialog.getByRole('textbox', { name: 'Likes', exact: true });
  const dislikes = dialog.getByRole('textbox', { name: 'Dislikes', exact: true });

  await t.type(likes, duplicate);
  await likes.press('Enter');
  await t.type(dislikes, duplicate);
  await dislikes.press('Enter');
  await t.wait(1600);
  await t.hover(dislikes, 1800);
}

export const setup = {
  async before(t) {
    await t.signIn(process.env.SD_E2E_EMAIL ?? 'quinntynebrown@gmail.com', process.env.SD_E2E_PASSWORD ?? 'password123');
  },
  async after(t) {
    await t.signIn(process.env.SD_E2E_EMAIL ?? 'quinntynebrown@gmail.com', process.env.SD_E2E_PASSWORD ?? 'password123');
  },
};

export const clips = {
  async before(t) {
    const { dialog, duplicate } = await openDialog(t, baseline);
    const likes = dialog.getByRole('textbox', { name: 'Likes', exact: true });
    const dislikes = dialog.getByRole('textbox', { name: 'Dislikes', exact: true });
    await t.type(likes, duplicate);
    await likes.press('Enter');
    await t.type(dislikes, duplicate);
    await dislikes.press('Enter');
    await t.wait(1500);
    await t.hover(dislikes, 1800);
  },
  async after(t) {
    await attemptDuplicates(t);
  },
};
