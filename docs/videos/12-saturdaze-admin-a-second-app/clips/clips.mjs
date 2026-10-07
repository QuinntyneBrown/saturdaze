// Screen recordings for video 12 (tools/video-record/record-clips.mjs). Runs against
// Saturdaze Admin and the API with the admin demo data (tools/video-record/admin-demo).
export const config = {
  baseURL: process.env.SD_ADMIN_URL ?? 'http://localhost:4300',
  apiURL: process.env.SD_API_URL ?? 'http://localhost:5100',
  viewport: { width: 1408, height: 792 },
};

export const viewports = { narrow: { width: 390, height: 792 } };

export const clips = {
  /** An anonymous visitor asks for Places, signs in, and lands on Places (L2-111 AC4). */
  async 'deep-link'(t) {
    await t.go('/places');
    await t.wait(1600);
    await t.type(t.page.getByLabel('Email'), 'admin@saturdaze.app');
    await t.type(t.page.getByLabel('Password'), 'password123', 40);
    await t.wait(400);
    await t.click(t.page.getByRole('button', { name: 'Sign in' }));
    await t.page.waitForURL(/\/places/);
    await t.wait(3500);
  },

  /** A family account signs in and meets the gate, then signs out (L2-111 AC1, AC5). */
  async gate(t) {
    await t.go('/sign-in');
    await t.wait(800);
    await t.type(t.page.getByLabel('Email'), 'quinntynebrown@gmail.com');
    await t.type(t.page.getByLabel('Password'), 'password123', 40);
    await t.click(t.page.getByRole('button', { name: 'Sign in' }));
    await t.page.getByText("This account can't use Saturdaze Admin").waitFor();
    await t.wait(2500);
    await t.hover(t.page.getByRole('link', { name: 'Open Saturdaze' }), 1800);
    await t.click(t.page.getByRole('button', { name: 'Sign out' }));
    await t.page.waitForURL(/\/sign-in/);
    await t.wait(2500);
  },

  /** The side navigation: every admin destination in turn. */
  async tour(t) {
    await t.go('/');
    await t.wait(2500);
    for (const name of ['Places', 'Review queue', 'Ingestion skips', 'Activity log', 'Photo health']) {
      await t.click(t.page.locator('.admin-nav__link', { hasText: name }));
      await t.page.waitForLoadState('networkidle');
      await t.wait(2200);
    }
    await t.hover(t.page.locator('.admin-nav__account'), 1500);
  },

  /** Below 1024 px the same destinations sit in a top bar. */
  async narrow(t) {
    await t.go('/');
    await t.wait(1800);
    await t.scroll(500, 1200);
    await t.wait(600);
    await t.scroll(-500, 900);
    await t.click(t.page.locator('.admin-nav__link', { hasText: 'Places' }));
    await t.page.waitForLoadState('networkidle');
    await t.wait(2200);
    await t.scroll(600, 1400);
    await t.wait(1500);
    await t.scroll(-600, 900);
    await t.wait(600);
    // The top bar scrolls sideways to reach the later destinations.
    await t.page.locator('.admin-nav__links').evaluate((el) => el.scrollBy({ left: 200, behavior: 'smooth' }));
    await t.wait(1200);
    await t.click(t.page.locator('.admin-nav__link', { hasText: 'Review queue' }));
    await t.page.waitForLoadState('networkidle');
    await t.wait(2200);
    await t.scroll(700, 1600);
    await t.wait(2500);
  },
};

export const setup = {
  tour: (t) => t.signIn('admin@saturdaze.app'),
  narrow: (t) => t.signIn('admin@saturdaze.app'),
};
