The lighter bar for public pages — landing, legal, the shared sample weekend and the dialogs gallery (route `data.shell: 'site'`). The wordmark sits left and links home; "Sign in" and an optional coral "Create your account" CTA sit right. It shows at every width, unlike the app's top bar / bottom nav pair.

The host carries `.sitebar` from `docs/mocks-v2/styles/app.css` and, like `sd-top-bar`, uses the `Scrolled` host directive to fade in a blurred backdrop once the page scrolls. Below 380px with `cta` set, the "Sign in" link hides — the landing hero repeats it.
