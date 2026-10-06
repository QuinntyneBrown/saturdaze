/** `.family-grid` / `.account-card` from `family.page.scss` (page-owned in the app). */
export const FAMILY_STYLES = [
  `.family-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 32px; }`,
  `.family-grid__col { display: flex; flex-direction: column; gap: 32px; min-width: 0; }`,
  `.family-grid__col sd-section { margin-bottom: 0; }`,
  `.account-card { flex-direction: row; align-items: center; gap: 12px; }`,
  `.account-card__text { flex: 1; min-width: 0; }`,
  `.account-card__title { font-weight: var(--sd-fw-semibold); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }`,
  `.account-card__sub { font-size: var(--sd-fs-sm); color: var(--sd-ink-soft); margin-top: 2px; }`,
  `@media (min-width: 1024px) { .family-grid { grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 40px; } }`,
];

export const FAMILY_PAGE = `
  <sd-page-header title="The Browns" subtitle="Port Credit, Mississauga. Every weekend is planned around this." />
  <div class="family-grid">
    <div class="family-grid__col">
      <sd-section title="Who's in" subtitle="Ages shape the picks. Tap a person to edit.">
        <sd-list card>
          <sd-list-item action chevron title="Quinn" subtitle="Parent · 38"><sd-avatar slot="leading" name="Quinn" tone="primary" size="lg" /></sd-list-item>
          <sd-list-item action chevron title="Sara" subtitle="Parent · 36"><sd-avatar slot="leading" name="Sara" tone="sun" size="lg" /></sd-list-item>
          <sd-list-item action chevron title="Eli" subtitle="Kid · 9"><sd-avatar slot="leading" name="Eli" tone="sky" size="lg" /></sd-list-item>
          <sd-list-item action chevron title="Mae" subtitle="Kid · 5"><sd-avatar slot="leading" name="Mae" tone="leaf" size="lg" /></sd-list-item>
        </sd-list>
        <sd-ghost-row icon="plus">Add a family member</sd-ghost-row>
      </sd-section>

      <sd-section title="Locked in every weekend" subtitle="Anchors. The plan goes around them.">
        <sd-list card>
          <sd-list-item action chevron title="Swim lessons" subtitle="Saturdays · 9:00 to 10:00"><sd-disc slot="leading" icon="bike" tone="accent" /></sd-list-item>
          <sd-list-item action chevron title="Church" subtitle="Sundays · 10:30 to 11:45"><sd-disc slot="leading" icon="pin" tone="accent" /></sd-list-item>
          <sd-list-item action chevron title="Workout window" subtitle="Saturdays · 5:00 to 6:00pm"><sd-disc slot="leading" icon="bike" tone="accent" /></sd-list-item>
        </sd-list>
        <sd-ghost-row icon="plus">Add a commitment</sd-ghost-row>
      </sd-section>
    </div>

    <div class="family-grid__col">
      <sd-section title="Home">
        <sd-button slot="action" variant="quiet" size="sm"><sd-icon name="edit" />Edit</sd-button>
        <sd-list card>
          <sd-list-item title="Port Credit, Mississauga" subtitle="Weather and drive times start here"><sd-disc slot="leading" icon="pin" /></sd-list-item>
        </sd-list>
      </sd-section>

      <sd-section title="Likes and dislikes" subtitle="Liked tags get a boost. Disliked ones are left out.">
        <sd-button slot="action" variant="quiet" size="sm"><sd-icon name="edit" />Edit</sd-button>
        <div class="sd-cluster">
          <sd-chip tone="leaf"><sd-icon name="heart" [size]="13" [stroke]="2" />Parks</sd-chip>
          <sd-chip tone="leaf"><sd-icon name="heart" [size]="13" [stroke]="2" />Short hikes</sd-chip>
          <sd-chip tone="leaf"><sd-icon name="heart" [size]="13" [stroke]="2" />Zoo</sd-chip>
          <sd-chip tone="leaf"><sd-icon name="heart" [size]="13" [stroke]="2" />Rec Room</sd-chip>
          <sd-chip tone="leaf"><sd-icon name="heart" [size]="13" [stroke]="2" />Lavender</sd-chip>
          <sd-chip tone="leaf"><sd-icon name="heart" [size]="13" [stroke]="2" />Live theatre</sd-chip>
          <sd-chip tone="warn"><sd-icon name="close" [size]="13" [stroke]="2" />Camping</sd-chip>
          <sd-chip tone="warn"><sd-icon name="close" [size]="13" [stroke]="2" />Drives over 60 min</sd-chip>
        </div>
      </sd-section>

      <sd-section title="Preferences">
        <sd-list card>
          <sd-list-item title="Budget matters" subtitle="Prefer free and low-cost picks">
            <sd-toggle slot="trailing" srLabel="Budget matters" checked />
          </sd-list-item>
          <sd-list-item title="Try something new each weekend" subtitle="One first-time activity per weekend">
            <sd-toggle slot="trailing" srLabel="Try something new each weekend" />
          </sd-list-item>
          <sd-list-item title="Friday preview email" subtitle="A draft in your inbox at 6pm Friday">
            <sd-toggle slot="trailing" srLabel="Friday preview email" checked />
          </sd-list-item>
        </sd-list>
      </sd-section>

      <sd-section title="Admin">
        <sd-list card>
          <sd-list-item href="/review-submissions" chevron title="Review submissions" subtitle="3 waiting">
            <sd-disc slot="leading" icon="ticket" tone="sun" />
            <sd-chip slot="trailing" tone="sun" count>3</sd-chip>
          </sd-list-item>
        </sd-list>
      </sd-section>

      <sd-section title="Account">
        <sd-card variant="sunk" class="account-card">
          <sd-avatar name="quinn@saturdaze.app" tone="primary" size="lg" />
          <div class="account-card__text">
            <p class="account-card__title">quinn@saturdaze.app</p>
            <p class="account-card__sub">Signed in since May 2026</p>
          </div>
          <sd-button variant="quiet" warnText><sd-icon name="sign_out" />Sign out</sd-button>
        </sd-card>
      </sd-section>
    </div>
  </div>
`;
