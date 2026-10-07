## Best practices

### Content

- Say what is accepted next to the zone (the dialog subtitle or a hint): "JPEG, PNG or WebP up to 10 MB".
- Check the file before showing a preview, and show refusals in a banner beside the zone rather than inside it.
- Describe the chosen file in `caption` (name, size and pixel dimensions) so the curator can confirm it is the right one.

### Behaviour

- Revoke the object URL you pass as `src` when the dialog closes or a new file replaces it.

### Accessibility

- Use a `label` that says what the photo is for ("Choose a photo", "Upload your own photo"); the projected content is decorative to assistive technology.
