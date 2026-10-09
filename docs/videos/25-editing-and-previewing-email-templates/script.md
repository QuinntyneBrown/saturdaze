# 25 · Editing and previewing email templates

Video twenty-four created templates. This one opens the editor. You will see how the content is edited and saved, how placeholders get sample values, how the live preview renders exactly what a sender would, the rules that keep administrator-written HTML from ever running script, and what happens when two administrators edit the same template at once. Recorded against the email demo data, as of October 2026.

## The editor

Open a template and the editor shows its header first: the key, the category, the version, and the last change with its time in UTC and who made it. Under it sit the status chip, and for a system template the System chip and a note that explains what it must keep. The form holds the name, the description, the subject, the preheader, and the two bodies. The bodies are set in a monospace font, without wrapping or spellcheck, because they are source text, not prose.

Save changes is disabled until something actually changes. Here the subject is rewritten to start with the recipient's name, and two things happen at once: an Unsaved changes chip appears, and the preview on the right shows the new subject with a sample name in it. The preheader gains a new placeholder, start time, and a field for it appears under Sample data. Fill it in, save, and the version goes up by one, the chip disappears, and Save is disabled again.

## Placeholders and sample data

A placeholder is a name in double curly braces. The name is letters, digits and underscores, in parts joined by dots, and each part starts with a letter, so family dot first underscore child is fine. Spaces just inside the braces are allowed. Anything else between braces is refused, with the code invalid placeholder: a space inside the name, empty braces, a missing closing brace, or triple braces.

Six placeholders are built in, and every template may use them without sample data: app name, app URL, recipient name, recipient email, unsubscribe URL and current year. The preview fills them with fixed samples: Saturdaze, the app's address from configuration, Alex, alex at example dot com, an unsubscribe link, and this year.

Every other placeholder the content uses gets a sample field. Sample data is saved with the template, at most a hundred names, each value at most two thousand characters. A blank sample is not saved, and a sample for a placeholder the content no longer uses is dropped.

## The live preview

The preview sits beside the form from twelve hundred pixels, and below it on narrower screens. About three hundred milliseconds after you stop typing, the editor sends the unsaved content to the preview endpoint, and the panel refreshes. Nothing is saved.

At the top is the inbox line: the rendered subject and preheader. Below it is the rendered HTML, six hundred pixels wide on Desktop, three hundred and seventy-five on Phone, so you can see how a narrow mail client wraps it. Plain text shows the text body exactly as it would be sent. Under the email, every placeholder the content used is listed with its value and where the value came from: Sample, Built-in, or, flagged in amber, No sample value. Add a gift code to the subject without a sample, and it renders as nothing, and the list tells you so before anyone receives an email with a hole in it.

## How a preview is rendered

The renderer lives in the application layer and has no database access, so a future sender can use the same code with real values instead of samples. It finds every placeholder, then fills it with the sample value if there is one, else the built-in, else an empty string. It records each placeholder once, in the order it was first used, with its source.

One detail matters for safety. Values placed into the HTML body are HTML encoded. A sample of angle bracket b, bold, renders as the literal characters, never as a bold element. The subject, preheader and text body take values as written, because none of them is HTML.

## Keeping template HTML inert

Template HTML is written by administrators, and a sender will one day put it in front of families. So two layers keep it inert.

The first is a check on every save and every preview. It looks inside each tag and refuses script, iframe, frame, object, embed, applet, form and base elements, any attribute that starts with on and sets an event handler, and any javascript, vbscript or data text slash HTML address, even when it is written with odd capitals, spaces or character entities. Text between tags is not inspected, so an email can still talk about being online.

Here a draft's subject first gets a malformed placeholder, and the preview pauses with the reason while keeping its last good render. Then an image with an error handler goes into the HTML body. The preview refuses it, and so does Save, with the message that scripts, frames, forms and event attributes are not allowed in an email.

The second layer is the preview frame itself. The HTML renders in an iframe whose sandbox allows neither scripts nor same origin access, and whose document carries a content security policy that blocks scripts and every fetch except HTTPS images and fonts. Even if something slipped past the check, it could not run in the admin app.

## Placeholders a template must keep

Some placeholders are not optional. A system template must keep its link in both bodies: the verification link, or the reset link. A marketing template must keep the unsubscribe link in both bodies, so every recipient can opt out. Here the password reset text body is rewritten without its link. Save is refused with the code missing placeholder, and the message names exactly what is missing: the HTML body and the plain-text body both need the reset link.

## Two administrators, one template

The version number protects against lost work. The editor remembers the version it loaded and sends it with every save. If the stored version has moved on, the save is refused with the code template stale and a conflict status, and nothing changes. The version is also an optimistic concurrency token in the database, so two saves racing in the same instant cannot both win.

In the recording, the second curator saves the holiday greeting while this editor still has it open. The administrator rewrites the subject and saves. The editor says someone else changed this template and offers Reload. Reload throws away the stale copy and shows what is saved now, at the newer version. Nothing the other curator wrote was overwritten.

## Recap

Things to remember.

- Save is enabled only when something changed; every save adds one to the version and records who and when.
- Placeholders are letters, digits and underscores in dotted parts; six are built in, the rest get sample values.
- The preview renders unsaved content in about three hundred milliseconds, at desktop and phone widths and as plain text, and flags placeholders without a sample.
- Values are HTML encoded into the HTML body; scripts, frames, forms, event handlers and script addresses are refused; the preview frame is sandboxed.
- System templates keep their link and marketing templates keep unsubscribe, in both bodies.
- A stale save is refused, and Reload shows the newer version.

Next, video twenty-six covers the lifecycle: activating, archiving, restoring and deleting templates, and the revision history behind every change.
