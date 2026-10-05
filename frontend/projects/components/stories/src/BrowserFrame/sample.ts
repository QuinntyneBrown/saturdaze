/** The landing hero's miniature weekend (`landing-sample.ts` in the app). */
export const MINI_WEEKEND_TEMPLATE = `
  <div class="mini">
    <sd-day title="Saturday" meta="17 May · 22° / 14°" weather="sun" [actions]="false">
      <sd-block time="9:00" duration="60m" icon="bike" title="Swim lessons" subtitle="Every Saturday" commitment readonly>
        <sd-chip slot="chips" tone="accent"><sd-icon name="lock" [size]="13" [stroke]="2" />Commitment</sd-chip>
      </sd-block>
      <sd-block time="10:30" duration="45m" icon="car" title="Drive to Terre Bleu" drive readonly />
      <sd-block time="11:00" duration="2h" icon="tree" title="Lavender fields" subtitle="Terre Bleu, Milton" readonly>
        <sd-chip slot="chips" tone="primary">Day highlight</sd-chip>
      </sd-block>
      <sd-block time="13:00" duration="75m" icon="fork" title="Lunch at La Marina" subtitle="Patio · 3 of 4 votes" readonly />
    </sd-day>
    <sd-day title="Sunday" meta="18 May · 18° / 12°" weather="cloud" [actions]="false">
      <sd-block time="9:15" duration="45m" icon="bag" title="Costco run" subtitle="Paper towels, bread" errand readonly>
        <sd-chip slot="chips" tone="indoor">Errand</sd-chip>
      </sd-block>
      <sd-block time="10:30" duration="75m" icon="pin" title="Church" subtitle="Every Sunday" commitment readonly>
        <sd-chip slot="chips" tone="accent"><sd-icon name="lock" [size]="13" [stroke]="2" />Commitment</sd-chip>
      </sd-block>
      <sd-block time="14:00" duration="2h" icon="popcorn" title="The Rec Room" subtitle="Bowling and arcade" readonly>
        <sd-chip slot="chips" tone="primary">Day highlight</sd-chip>
      </sd-block>
    </sd-day>
  </div>
`;

/** `.mini` from the landing page stylesheet. */
export const MINI_WEEKEND_STYLES = [
  `.mini { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; }`,
  `.mini ::ng-deep .day__header { position: static; padding-top: 4px; }`,
];
