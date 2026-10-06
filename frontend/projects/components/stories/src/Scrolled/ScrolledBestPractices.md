## Best practices

- Use it for sticky chrome that needs a backdrop only once content passes underneath. Style the state with an attribute selector (`[data-scrolled]`), not a class, so the mocks and the app share one hook.
- Prefer `hostDirectives: [Scrolled]` in a component over sprinkling `sdScrolled` in page templates.
- It tracks the **window**. It does not observe nested scroll containers; a sheet or panel with its own overflow needs its own listener.
