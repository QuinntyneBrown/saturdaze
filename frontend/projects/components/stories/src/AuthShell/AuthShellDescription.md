The page frame for the signed-out screens — Sign in, Create account, Reset password and Verify email (route `data.shell: 'bare'`, so there is no top bar or nav). It centres a 440px column holding the Saturdaze brand lockup, the projected `sd-auth-card`(s) and the Terms · Privacy · Back to Saturdaze footer.

The host is the page (`.auth`, `min-height: 100svh`) and carries the `.auth` / `.auth__col` / `.auth__brand` / `.auth__foot` classes from `docs/mocks/styles/app.css`. `stack` (`.auth--stack`) top-aligns the column for flows that show several cards at once.
