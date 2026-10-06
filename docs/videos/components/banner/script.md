# 05 · Coding sd-banner: tones, roles and a live region

In this video you build the S D banner, the inline message strip. It shows form errors on sign in, create account and reset password, save failures on the Weekend, Ideas food, Past, Family and review submissions pages, and errors in the cover photo and add to day dialogs. The shared weekend page also uses an info banner as a note. It is a tiny component, but it carries real accessibility weight, because an error banner must be announced to a screen reader the moment it appears. You will see how a single input drives both the A R I A role and the live region politeness.

## The decorator

Open the banner file in the components library. The selector is S D banner, the component is standalone, change detection is OnPush, and it imports the icon component for the optional leading glyph.

The host block starts with the class banner, the mock's block class, so per A D R nine the host is the banner. Then three class bindings, one per tone: banner dash dash info, warn and success, each true when the tone signal equals that word. The tone is not mirrored as an attribute: inputs stay inputs, and only classes and A R I A state go on the host, as A D R nine records.

The interesting part is the last two bindings. The role attribute is bound to the role input. And the aria live attribute is derived in the host binding itself: assertive when the role is alert, polite otherwise. That pairing matters. An alert interrupts what the screen reader is saying, which is right for an error that blocks the user. A status waits politely, which is right for a saved notice or a hint. Deriving one from the other in a single place means a page can never pair an alert role with polite announcements by mistake.

## Inputs

The class has three inputs. The tone is typed as a union of info, warn and success, and defaults to info. The icon is a string, and empty means no glyph. The role is typed as a union of alert or status, and defaults to status.

Notice that the input is called role, the same as the A R I A attribute. A page writes role equals alert on the element, the input captures it, and the host binding writes it back as the attribute. Because the default is status, every banner is a live region even if the page forgets the role.

The aria live expression is short enough to stay in the host binding. If it grew, you would move it into a computed signal, exactly like the avatar's initial. There is no output, no local state and no effect: the banner only displays what it is given.

## The template

The template is four lines. If there is an icon, it renders the icon component with that name at a size of twenty. Then a span with the banner text class wraps a default ng content slot, which receives the message.

Every page in the app uses it the same way for errors: tone warn, role alert, icon close, with the error signal interpolated as the content. Because the content is projected, the page can also put a link or bold text in the message.

## The styles

The host is a flex row with a ten pixel gap, padding, a medium border radius and a fourteen pixel font. The icon does not shrink and is nudged down two pixels to line up with the first line of text.

Each tone sets a background and its paired foreground. Warn uses status danger background one with status danger foreground one. Success uses the status success pair. Info uses neutral background three with neutral foreground one. As A D R thirteen requires, these are tokens read by role, and using the pairs together keeps the contrast correct.

The text span has a min width of zero, so long words can wrap inside the flex row instead of overflowing.

## The unit tests

The spec file creates the banner directly and also declares a host component that renders a warn banner with role alert, the close icon, and the text something went wrong.

The first test, creates a polite info status by default, checks the banner and banner info classes, a role of status, an aria live of polite, no icon, and the text span.

The second, mirrors the tone to a host class, loops over warn, success and info with set input on the component ref, and checks the class each time. At the end it checks that the warn class is gone, which proves the bindings remove a class as well as add it.

The third, becomes an assertive alert for errors, sets the role to alert and expects aria live to become assertive. That is the accessibility contract in one test.

The fourth, renders a leading glyph only when an icon is given, sets an icon of lock, checks that the lock glyph is drawn in the icon's S V G, then sets an empty string and checks the icon is gone.

The last, projects the message into the text span, renders the host component and checks the text, the alert role, the warn class and the drawn close glyph.

## Pitfalls

A few pitfalls. Don't set aria live yourself on the page; the banner derives it from the role. Don't use role alert for success messages, or you interrupt the user for good news. Wrap the banner in an if block so it only exists while there is a message, as the pages do, instead of leaving an empty strip on screen. And don't hard code colours: use the tone input.

## Recap

Things to remember.

- The host is the banner, with one class binding per tone.
- The role input drives both the role attribute and aria live.
- Alert is assertive for errors, status is polite for everything else.
- The message is projected into one default slot.
- Tones use paired background and foreground tokens.

Next, in video six, we build the S D block, one row of a day's timeline, with outputs and focus handling.
