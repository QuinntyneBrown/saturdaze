`[sdScrolled]` is a tiny attribute directive that sets `data-scrolled` on its host once the window has scrolled more than 4px, and removes it back at the top. `sd-top-bar` and `sd-sitebar` apply it as a **host directive** and style `:host([data-scrolled])` to fade in their translucent, blurred backdrop.

The scroll listener is registered after first render, runs outside Angular's zone and writes a signal, so change detection only runs when the state actually flips. It is removed on destroy. The public `scrolled` signal is readable from a host that injects the directive.
