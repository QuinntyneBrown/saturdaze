# 18 · How account emails are drafted

Saturdaze asks you to check your email in two places: right after you create an account, and after you ask to reset a forgotten password. This video follows what happens behind those two screens: what the server drafts, what it stores, and what actually leaves it. The honest answer first. As of October 2026, Saturdaze drafts a link, but no email is sent, because there is no email provider yet. Everything around it is real: the tokens, the expiry, the single use and the screens. It is ready for a sender to plug into.

## Drafting a token

Every account email is built around one thing: a random token that goes into a link. The token comes from the same two helpers that make refresh tokens. `CreateRawRefreshToken` takes thirty-two bytes from a cryptographic random number generator and encodes them as base sixty-four URL text, so they survive a query string. `HashRefreshToken` turns that text into a SHA-256 hash, written as lowercase hex.

The raw token is what would go into the email. The hash is what goes into the database. That split matters. Someone who reads the database cannot rebuild a working link, because they only see hashes. When a link comes back, the server hashes what it receives and looks that hash up.

Both kinds of token share one shape. An `EmailVerificationToken` and a `PasswordResetToken` each hold the user, the token hash, when it was created, when it expires, and when it was consumed. Consumed starts empty. The moment a link is used, or replaced by a newer one, consumed gets a time, and the link is dead. That one column is what makes every link single use.

When a handler is done, it returns an `AuthTokenDeliveryDto`: the email address, the raw token and its expiry. Think of it as the envelope. It holds everything an email would need, addressed and ready, and today nobody posts it.

## The verification email

When you create an account, the register handler saves the user with no verified time, and drafts a verification token that lasts twenty-four hours. Then it throws the raw value away. Registration returns your sign-in tokens, never the verification link. So the first link is drafted and lost. You can still sign in, because verification gates nothing yet; the family screen simply notes that your email is not verified.

Resend is where a usable link comes from. The resend handler finds the account by its normalized email. If there is no account, or it is already verified, it returns no token. Otherwise it consumes every live verification token, so older links stop working, and drafts a fresh one that also lasts twenty-four hours.

When the link is opened, the verify handler hashes the token and looks it up. An unknown token, or one already used, is token invalid. A token past its expiry is token expired. Otherwise it stamps consumed, sets the verified time, and returns the user.

Here is the page doing that, with a throwaway account. Right after sign-up, there is no token in the address, so the page shows the sent card: check your email, with the address masked to its first and last letters. The Resend button works once, then rests for a minute. That throttle lives in the page, not on the server. Then we open the link with the token in the query string. The page verifies it, and says you are verified, with a way into family setup.

## The password reset email

Forgot password follows the same recipe, with two differences. First, it never says whether an account exists. An unknown email gets the same two-oh-two Accepted as a known one, and the reset page shows the sent card either way, even if the call fails. Second, the token is short-lived. The handler sets the expiry to sixty minutes, and revokes any earlier reset link that is still live.

In the recording, we ask for a reset link, and get the sent card with the masked address. Opening the link moves the page to choose a new password. The reset handler rejects anything shorter than eight characters and checks the token the same way verify does. Then it consumes the token, stores the new password hash, and revokes every other session for the account, as ADR-007 and L2-005 require. Use the same link a second time, and saving gives you this link has expired, because consumed is already set.

Notice a drift while you are here. The screens say the link works for thirty minutes, but the code says sixty. The screen is the promise a family reads, so one of them should change. That is a behaviour change with its own requirement, not something to fix quietly.

## Delivery

So where does the envelope go? Into the response, but only on a developer's machine. The forgot password and resend endpoints both pass the result through `DevDelivery` in the auth controller. In Development and in the Testing host, it returns the email, the token and the expiry in the two-oh-two body. In every other environment it returns an empty object. Production drafts the link and drops it.

That is also how the tests read your inbox. The end-to-end fixture `devToken` posts to forgot password or resend verification, reads the token from the body, and opens the page with it. The API tests read the same body. If the token comes back empty, the fixture tells you the API is not running as Development.

The drift audit records this as gap G01: the handlers create delivery tokens, but no email provider sends them. When one is added, the envelope is already the right shape. A sender in the application layer takes the delivery record, builds the link and the message, and the controller stops handing tokens back. Like any behaviour change here, that starts with a requirement, a design and a mock, before any code.

## Recap

Things to remember.

- Every account email starts as thirty-two random bytes. The link carries the raw token; the database keeps only its SHA-256 hash.
- Consumed is the single-use switch. Using a link, or asking for a new one, kills the old one.
- Verification links last twenty-four hours. Reset links last sixty minutes in code, though the screens still say thirty.
- Forgot password never reveals whether an account exists.
- No email is sent yet. Outside Development, the drafted link goes nowhere.

The full flows, with sequence diagrams, are in the detailed designs under identity and access.
