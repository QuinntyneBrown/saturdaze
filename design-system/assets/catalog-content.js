export const iconNames = [
  'sun', 'cloud', 'rain', 'snow', 'lock', 'unlock', 'refresh', 'swap', 'map', 'car',
  'fork', 'home', 'calendar', 'heart', 'star', 'user', 'plus', 'close', 'arrow_left',
  'arrow_right', 'chevron_right', 'more', 'bag', 'ticket', 'bed', 'bike', 'tree',
  'popcorn', 'thumbs_up', 'thumbs_down', 'share', 'sparkle', 'mail', 'check', 'key',
  'sign_out', 'copy', 'pin', 'search',
];

const button = (label, variant = '', icon = '') => `<sd-button${variant ? ` variant="${variant}"` : ''}>${icon ? `<sd-icon slot="leading" name="${icon}" size="16"></sd-icon>` : ''}${label}</sd-button>`;
const actionSlots = (items) => items.map(({ label, variant = '', icon = '', action = 'close' }) => `<sd-button slot="actions"${variant ? ` variant="${variant}"` : ''} data-dialog-${action}>${icon ? `<sd-icon slot="leading" name="${icon}" size="16"></sd-icon>` : ''}${label}</sd-button>`).join('');
const note = (text, icon = 'sparkle') => `<sd-card variant="sunk"><div class="inline-note"><sd-icon name="${icon}" size="17"></sd-icon><span>${text}</span></div></sd-card>`;
const listItem = (title, subtitle, icon = 'sparkle', trailing = 'chevron_right') => `<sd-list-item compact title="${title}" subtitle="${subtitle}"><sd-icon slot="leading" name="${icon}" size="18"></sd-icon>${trailing ? `<sd-icon slot="trailing" name="${trailing}" size="16"></sd-icon>` : ''}</sd-list-item>`;

const dialogDefinitions = {
  'sign-out/default': {
    title: 'Sign out?', subtitle: "I'll forget you on this device until you sign back in.",
    content: note("You'll need quinn@example.com and your password to sign back in. Saved weekends and family settings stay put.", 'key'),
    actions: [{ label: 'Stay signed in', variant: 'secondary' }, { label: 'Sign out', variant: 'danger', icon: 'sign_out', action: 'confirm' }],
  },
  'family-member/add': {
    title: 'Add family member', subtitle: 'A little context helps make every suggestion fit.',
    content: `<form class="demo-form"><label>Name<input value="Mae" placeholder="e.g. Mae"></label><label>Age<input type="number" value="8" min="0" max="120"><small>0–120 — used for age-appropriate activities.</small></label></form>`,
    actions: [{ label: 'Cancel', variant: 'secondary' }, { label: 'Add member', icon: 'plus', action: 'confirm' }],
  },
  'commitment/add': {
    title: 'Add a commitment', subtitle: 'Fixed plans stay put when the weekend is regenerated.',
    content: `<form class="demo-form"><label>Title<input value="Eli's soccer practice"></label><label>Day<select><option>Saturday</option><option>Sunday</option></select></label><div class="field-pair"><label>Start<input type="time" value="09:00"></label><label>End<input type="time" value="10:30"></label></div></form>`,
    actions: [{ label: 'Cancel', variant: 'secondary' }, { label: 'Add commitment', icon: 'plus', action: 'confirm' }],
  },
  'submit-event/default': {
    title: 'Tell me about an event', subtitle: "Quick version. Title, when, and you're done — the rest is optional.",
    content: `<form class="demo-form"><label>Event title<input value="Port Credit Buskerfest"></label><label>When it starts<input type="datetime-local" value="2026-05-17T11:00"><small>Defaulted to one hour from now.</small></label><label>Location <span class="optional">Optional</span><input value="Memorial Park, Lakeshore Rd"></label>${note('Goes into moderation. Approved events become visible to nearby families.')}</form>`,
    actions: [{ label: 'Open full form', variant: 'ghost' }, { label: 'Cancel', variant: 'secondary' }, { label: 'Submit', icon: 'plus', action: 'confirm' }],
  },
  'approve-submission/default': {
    title: 'Approve Port Credit Buskerfest?', subtitle: "It'll be published to every family within driving distance.",
    content: `${note('Saturday, May 17 · Memorial Park · Submitted by neighbour@example.com.', 'check')}<p class="muted-copy">The submitter will see “Approved” next time they open the events page.</p>`,
    actions: [{ label: 'Cancel', variant: 'secondary' }, { label: 'Approve & publish', icon: 'check', action: 'confirm' }],
  },
  'reject-submission/default': {
    title: 'Reject this submission?', subtitle: 'The submitter sees your reason — keep it kind.',
    content: `${note('“Duplicate farmers market” · Submitted by neighbour@example.com.', 'close')}<form class="demo-form"><label>Reason <span class="optional">Optional</span><textarea rows="3" placeholder="Already covered by the curated listing."></textarea></label></form>`,
    actions: [{ label: 'Cancel', variant: 'secondary' }, { label: 'Reject', variant: 'danger', icon: 'close', action: 'confirm' }],
  },
  'product-action/calendar': {
    title: 'Add this weekend to your calendar', subtitle: 'Subscribe to keep it in sync — or download just this one.',
    content: `<div class="dialog-list">${listItem('Subscribe (webcal)', 'Updates automatically each Friday at 6pm', 'calendar', '')}${listItem('Open in Google Calendar', 'Adds Saturday and Sunday in one shot', 'calendar')}${listItem('Download .ics', 'This weekend only — one-time import', 'arrow_right')}</div>${note('Subscribed calendars stay in sync when the plan changes.')}`,
    actions: [{ label: 'Close', variant: 'secondary' }],
  },
  'product-action/share': {
    title: 'Share this weekend', subtitle: 'A read-only preview that opens without an account.',
    content: `<div class="copy-row"><code>https://saturdaze.app/w/7hf3k</code><button type="button" aria-label="Copy link" data-copy><sd-icon name="copy" size="16"></sd-icon></button></div><p class="muted-copy">Anyone with this link can view Saturday and Sunday.</p>`,
    actions: [{ label: 'Cancel', variant: 'secondary' }, { label: 'Copy link', variant: 'ghost', icon: 'copy' }, { label: 'Send', icon: 'share', action: 'confirm' }],
  },
  'product-action/share-native-unavailable': {
    title: 'Share this weekend', subtitle: 'Native sharing is unavailable here, so the link is ready to copy.',
    content: `<div class="copy-row"><code>https://saturdaze.app/w/7hf3k</code><button type="button" aria-label="Copy link" data-copy><sd-icon name="copy" size="16"></sd-icon></button></div>${note('Link copied. Paste it into a message or email.', 'check')}`,
    actions: [{ label: 'Close', variant: 'secondary' }, { label: 'Copy again', icon: 'copy', action: 'confirm' }],
  },
  'product-action/regenerate-weekend': {
    title: 'Regenerate the weekend?', subtitle: 'Locked blocks stay put. Everything else gets a fresh draft.',
    content: note('Swim, church, workouts, and bedtime anchors stay locked.', 'lock'),
    actions: [{ label: 'Cancel', variant: 'secondary' }, { label: 'Regenerate', icon: 'refresh', action: 'confirm' }],
  },
  'product-action/regenerate-day': {
    title: 'Regenerate Saturday?', subtitle: 'Sunday and your locks stay put.',
    content: note('Locked blocks on Saturday stay exactly where they are.', 'lock'),
    actions: [{ label: 'Cancel', variant: 'secondary' }, { label: 'Regenerate Saturday', icon: 'refresh', action: 'confirm' }],
  },
  'product-action/map': {
    title: 'Saturday on a map', subtitle: '1h 10m driving · 3 stops · Port Credit → Milton → home',
    content: `<div class="map-stub"><span><sd-icon name="home"></sd-icon></span><span><sd-icon name="tree"></sd-icon></span><span><sd-icon name="fork"></sd-icon></span></div><div class="dialog-list">${listItem('Home — Port Credit', '9:00am · start of day', 'home', '')}${listItem('Terre Bleu Lavender Farm', '11:00am · 45 min drive', 'tree', '')}${listItem('La Marina — lunch', '1:00pm · 6 min away', 'fork', '')}</div>`,
    actions: [{ label: 'Close', variant: 'secondary' }, { label: 'Open in Google Maps', icon: 'share', action: 'confirm' }],
  },
  'product-action/surprise': {
    title: 'Try something new this weekend', subtitle: "Picks you haven't done with the kids before.",
    content: `<div class="dialog-list">${listItem('Riverwood Conservancy', '8 min · forest trails and owl barn', 'tree', '')}${listItem("Living Arts — kids' theatre", '5 min · Saturday matinée', 'ticket', '')}${listItem('Crawford Lake longhouse', '35 min · heritage village', 'tree', '')}</div>${note('Filtered by your likes, weather, and drive cap.')}`,
    actions: [{ label: 'Cancel', variant: 'secondary' }, { label: 'Reshuffle', variant: 'ghost' }, { label: 'Add to weekend', action: 'confirm' }],
  },
  'product-action/remix': {
    title: 'Remix this weekend?', subtitle: 'Same family vibe — fresh activities and food.',
    content: note('“Lavender and lake weekend” gets a fresh take.'),
    actions: [{ label: 'Cancel', variant: 'secondary' }, { label: 'Remix it', action: 'confirm' }],
  },
  'product-action/repeat': {
    title: 'Use this as the current plan?', subtitle: 'Your current draft will be replaced — saved weekends stay intact.',
    content: note("This replaces Saturday and Sunday's current draft.", 'refresh'),
    actions: [{ label: 'Cancel', variant: 'secondary' }, { label: 'Replace current', variant: 'danger', action: 'confirm' }],
  },
  'product-action/itinerary-more': {
    title: 'Saturday options', subtitle: '',
    content: `<div class="dialog-list">${listItem('Share this day', 'Read-only preview link', 'share')}${listItem('Add to calendar', 'Subscribe or download .ics', 'calendar')}${listItem('Export as text', 'Plain-text plan for messages', 'copy')}${listItem('See on map', 'All stops in one view', 'map')}</div>`,
    actions: [{ label: 'Close', variant: 'secondary' }],
  },
  'product-action/saved-more': {
    title: 'Saved weekends — options', subtitle: '',
    content: `<div class="dialog-list">${listItem('Sort by date', 'Newest first · active', 'calendar', '')}${listItem('Sort by family rating', 'Five stars first', 'star')}${listItem('Filter', 'By tone, weather, and family', 'more')}${listItem('Export all', 'Annual family scrapbook', 'arrow_right')}</div>`,
    actions: [{ label: 'Close', variant: 'secondary' }],
  },
  'product-action/restaurant-lock': {
    title: 'Lock La Marina for Saturday lunch?', subtitle: "I'll stop offering alternatives for this slot.",
    content: note('Votes are preserved and this pick appears in the weekend plan.', 'fork'),
    actions: [{ label: 'Not yet', variant: 'secondary' }, { label: 'Lock it in', icon: 'lock', action: 'confirm' }],
  },
};

export function dialogMarkup(family, scenario, { staticPreview = true } = {}) {
  const definition = dialogDefinitions[`${family}/${scenario}`];
  if (!definition) return `<sd-empty title="Dialog not found" subtitle="The requested scenario is not in the catalog."></sd-empty>`;
  const attributes = `${staticPreview ? ' static' : ''} open title="${definition.title.replaceAll('"', '&quot;')}"${definition.subtitle ? ` subtitle="${definition.subtitle.replaceAll('"', '&quot;')}"` : ''}`;
  return `<sd-dialog${attributes}>${definition.content}${actionSlots(definition.actions)}</sd-dialog>`;
}

const screen = (active, title, content, topAction = '') => `<div class="product-screen"><sd-top-bar title="${title}">${topAction}</sd-top-bar><div class="screen-body">${content}</div><sd-bottom-nav static active="${active}"></sd-bottom-nav></div>`;
const pageHeading = (eyebrow, title, copy = '') => `<div class="pattern-heading"><span>${eyebrow}</span><h2>${title}</h2>${copy ? `<p>${copy}</p>` : ''}</div>`;
const timeline = (day = 'Saturday', locked = false) => `${pageHeading('MAY 17', day, locked ? 'Locked commitments stay fixed.' : 'Sunny · 22° · 52 min driving')}<sd-timeline-block time="9:00" duration="60 min" title="Soccer practice" subtitle="Clarkson Community Centre" icon="bike" tone="fixed" locked></sd-timeline-block><sd-timeline-block time="11:00" duration="90 min" title="Terre Bleu Lavender Farm" subtitle="Milton" icon="tree" drive="35 min"${locked ? ' locked' : ''}></sd-timeline-block><sd-timeline-block time="1:00" duration="60 min" title="Lunch at La Marina" subtitle="Family vote winner" icon="fork" tone="meal" drive="6 min"></sd-timeline-block><sd-anticipate icon="rain" headline="Rain after 3pm" body="The outdoor stops finish before then." cta="View forecast"></sd-anticipate>`;

const authContent = (scenario) => {
  const definitions = {
    splash: ['A better weekend starts here.', 'Plans that fit your family, weather, and energy.', 'Get started'],
    login: ['Welcome back', 'Sign in to see your next weekend.', 'Sign in'],
    signup: ['Create your family account', 'A few details now make every plan more useful.', 'Create account'],
    'forgot-password': ['Reset your password', "We'll email a secure reset link.", 'Send reset link'],
    'forgot-password-error': ['That email needs another look', "We couldn't find an account for quinn@example.com.", 'Try again'],
    'check-email': ['Check your email', 'A secure link is waiting at quinn@example.com.', 'Open email app'],
    'check-email-empty': ['No email address found', 'Return to sign in and request a new link.', 'Back to sign in'],
    'verify-email': ['Email verified', 'Your family account is ready.', 'Start planning'],
    'verify-email-verifying': ['Verifying your email…', 'This should only take a moment.', 'Please wait'],
    'verify-email-expired': ['That link has expired', 'Request a fresh verification email.', 'Send a new link'],
    'reset-password': ['Choose a new password', 'Use at least 12 characters.', 'Update password'],
    'reset-password-success': ['Password updated', 'You can now sign in with your new password.', 'Continue to sign in'],
    'reset-password-expired': ['Reset link expired', 'For your security, reset links only work once.', 'Request another link'],
    terms: ['Terms of use', 'Clear expectations for using Saturdaze.', 'Return'],
    privacy: ['Privacy', 'Your family data helps tailor plans and remains yours.', 'Return'],
  };
  const [title, copy, cta] = definitions[scenario] ?? definitions.login;
  const form = ['login', 'signup', 'forgot-password', 'forgot-password-error', 'reset-password'].includes(scenario)
    ? `<div class="auth-fields"><sd-text-input label="Email" value="quinn@example.com" type="email"></sd-text-input>${['login', 'signup', 'reset-password'].includes(scenario) ? '<sd-text-input label="Password" type="password" value="weekend-ready"></sd-text-input>' : ''}</div>` : '';
  const legal = ['terms', 'privacy'].includes(scenario) ? `<div class="legal-copy"><p>Saturdaze uses the minimum information needed to make practical family plans.</p><p>Account owners can review, export, or remove their information.</p></div>` : '';
  return `<sd-auth-shell><sd-auth-card>${pageHeading('SATURDAZE', title, copy)}${form}${legal}<sd-button full${scenario.includes('verifying') ? ' disabled' : ''}>${cta}</sd-button></sd-auth-card><span slot="foot">Warm plans. Clear choices. Your family stays in control.</span></sd-auth-shell>`;
};

const weekendContent = (scenario) => {
  if (scenario === 'empty') return `<sd-hero greeting="Morning, the Browns" subtitle="No plan yet — let's make one that fits." cta="Plan this weekend"></sd-hero><sd-empty title="Your weekend is wide open" subtitle="Tell me what matters and I'll build a balanced first draft." icon="calendar">${button('Create a plan', '', 'sparkle')}</sd-empty>`;
  if (scenario === 'generating') return `<sd-hero greeting="Building your weekend…" subtitle="Balancing weather, travel, meals, and commitments." cta="Working"></sd-hero><div class="generation"><span></span><span></span><span></span><p>Checking travel times and the Saturday forecast…</p></div>`;
  if (scenario === 'lock-mode') return `${pageHeading('LOCK MODE', 'Choose what must stay put', 'Locked items survive every regeneration.')}<sd-day-card day="Saturday" date="May 17" weather="22° · sunny" highlight="Soccer and lavender farm"><sd-chip slot="chips" tone="accent"><sd-icon name="lock" size="12"></sd-icon> 2 locked</sd-chip></sd-day-card>${note('Tap any itinerary block to lock or unlock it.', 'lock')}`;
  if (scenario === 'sample') return `<sd-hero greeting="A sample Saturdaze" subtitle="A relaxed mix of outdoors, food, and family time." cta="Use this plan"></sd-hero><sd-weather-strip><sd-weather-day day="Sat" icon="sun" hi="22" lo="14" note="Light breeze"></sd-weather-day><sd-weather-day day="Sun" icon="cloud" hi="18" lo="12" note="Cozy afternoon"></sd-weather-day></sd-weather-strip><sd-day-card day="Saturday" date="May 17" weather="Sunny" highlight="Lavender farm and waterfront lunch"></sd-day-card>`;
  return `<sd-hero greeting="Morning, the Browns" subtitle="Saturday is sunny. Want me to map it out?" cta="Plan this weekend"></sd-hero><sd-weather-strip><sd-weather-day day="Sat" icon="sun" hi="22" lo="14" note="Best outdoors before 3pm"></sd-weather-day><sd-weather-day day="Sun" icon="cloud" hi="18" lo="12" note="Cloudy and calm"></sd-weather-day></sd-weather-strip><div class="day-grid"><sd-day-card day="Saturday" date="May 17" weather="22° · sunny" highlight="Lavender farm and lunch"></sd-day-card><sd-day-card day="Sunday" date="May 18" weather="18° · cloudy" highlight="Brunch and lakeside walk" icon="cloud"></sd-day-card></div>`;
};

const discoveryContent = (scenario) => {
  if (scenario === 'activities') return `${pageHeading('DISCOVER', 'Fresh ideas for this weekend', 'Matched to your weather, drive cap, and family.')}<div class="card-grid"><sd-activity-card title="Riverwood Conservancy" subtitle="Forest trails and owl barn" drive="8 min" why="Dry trails and new for Eli." tone="outdoor" ages="4–12" tag="Great today"></sd-activity-card><sd-activity-card title="Living Arts Centre" subtitle="Kids’ theatre matinée" drive="5 min" why="A good rainy-afternoon backup." icon="ticket" tone="indoor" ages="6+"></sd-activity-card></div>`;
  if (scenario === 'events') return `${pageHeading('NEARBY', 'Local events', 'Community picks within your drive cap.')}<sd-event-card title="Port Credit Buskerfest" venue="Memorial Park" when="11am–5pm" drive="9 min" date-day="17" date-mon="MAY" tag="Free"></sd-event-card><sd-event-card title="Kids’ theatre matinée" venue="Living Arts Centre" when="2pm" drive="5 min" date-day="18" date-mon="MAY" tag="Tickets" icon="ticket"></sd-event-card>`;
  const state = scenario.replace('restaurants-', '');
  const banner = state === 'refreshing' ? note('Finding three fresh lunch options…', 'refresh') : state === 'locked' ? note('La Marina is locked for Saturday lunch.', 'lock') : state === 'consensus' ? note('Everyone voted yes — strong family consensus.', 'check') : state === 'voted' ? note('Votes saved. One more family member to go.', 'thumbs_up') : '';
  return `${pageHeading('SATURDAY LUNCH', 'Pick together', 'Each person gets one vote per option.')}${banner}<sd-restaurant-card name="La Marina" style="Mediterranean · $$" near="Near Terre Bleu" drive="6 min" wifeapproved><sd-vote-row slot="votes" name="Quinn" tone="primary" vote="up"></sd-vote-row><sd-vote-row slot="votes" name="Eli" tone="sky" vote="${state === 'consensus' ? 'up' : 'none'}"></sd-vote-row></sd-restaurant-card>`;
};

const profileContent = (scenario) => {
  if (scenario === 'profile') return `${pageHeading('FAMILY', 'The Browns', 'Preferences make every plan feel more like yours.')}<sd-section title="Family members"><sd-list-item title="Quinn" subtitle="Planner · outdoors, coffee, live music"><sd-avatar slot="leading" name="Quinn" tone="primary"></sd-avatar></sd-list-item><sd-list-item title="Eli" subtitle="Age 8 · bikes, animals, pizza"><sd-avatar slot="leading" name="Eli" tone="sky"></sd-avatar></sd-list-item></sd-section><sd-section title="Planning preferences"><div class="toggle-list"><sd-toggle label="Weather-aware" checked></sd-toggle><sd-toggle label="Keep drives under 40 minutes" checked></sd-toggle></div></sd-section>`;
  const added = scenario === 'errand-added';
  const alternatives = scenario === 'errand-alt-slots';
  return `${pageHeading('QUICK STOP', added ? 'Errand added' : 'Fit in an errand', added ? 'Groceries now sit between soccer and the drive to Milton.' : 'I’ll place it where it adds the least travel.')}<sd-card variant="raised"><div class="demo-form"><label>What do you need?<input value="Groceries"></label><label>Estimated time<select><option>20 minutes</option><option>30 minutes</option></select></label></div></sd-card>${alternatives ? `<sd-section title="Best slots"><div class="choice-list">${listItem('10:15am · Clarkson', 'Adds 4 minutes driving', 'bag', '')}${listItem('2:15pm · Port Credit', 'On the way home', 'bag', '')}</div></sd-section>` : added ? note('Your route and calendar export have been updated.', 'check') : button('Find the best slot', '', 'sparkle')}`;
};

const moderationContent = (scenario) => {
  if (scenario === 'submit') return `${pageHeading('COMMUNITY EVENTS', 'Share something local', 'A quick submission helps nearby families discover it.')}<sd-card variant="raised"><div class="demo-form"><label>Event title<input value="Port Credit Buskerfest"></label><label>Starts<input type="datetime-local" value="2026-05-17T11:00"></label><label>Location<input value="Memorial Park"></label></div></sd-card>${button('Submit for review', '', 'plus')}`;
  if (scenario === 'submitted') return `<sd-empty title="Thanks — it’s in the queue" subtitle="Most events are reviewed within one day. You’ll see the decision here." icon="check">${button('Browse approved events', 'secondary')}</sd-empty>`;
  return `${pageHeading('ADMIN', 'Event moderation', 'Two submissions are waiting for review.')}<sd-section title="Pending"><sd-event-card title="Port Credit Buskerfest" venue="Memorial Park" when="11am–5pm" date-day="17" date-mon="MAY" tag="Pending"></sd-event-card><div class="row-actions">${button('Reject', 'danger')}${button('Approve', '', 'check')}</div><sd-event-card title="Neighbourhood bike rodeo" venue="Clarkson Park" when="10am" date-day="18" date-mon="MAY" tag="Pending" icon="bike"></sd-event-card></sd-section>`;
};

export function patternMarkup(pattern, scenario) {
  switch (pattern) {
    case 'shell-navigation':
      return screen(scenario === 'desktop' ? 'activities' : 'home', 'This weekend', `${pageHeading('NAVIGATION', scenario === 'desktop' ? 'Desktop rail behavior' : 'Mobile bottom navigation', 'The same four destinations stay stable across breakpoints.')}<sd-card variant="raised"><strong>Responsive shell</strong><p class="muted-copy">Resize this preview to see the navigation adapt.</p></sd-card>`);
    case 'authentication': return authContent(scenario);
    case 'weekend-overview': return screen('home', 'This weekend', weekendContent(scenario));
    case 'itinerary': return screen('home', `${scenario === 'sunday' ? 'Sunday' : 'Saturday'} itinerary`, timeline(scenario === 'sunday' ? 'Sunday' : 'Saturday', scenario === 'locked-day'), `<sd-icon-button slot="trailing" icon="more" label="More options" variant="ghost"></sd-icon-button>`);
    case 'discovery': return screen('activities', scenario === 'events' ? 'Events' : 'Discover', discoveryContent(scenario));
    case 'profile-errands': return screen('profile', scenario === 'profile' ? 'Family' : 'Errands', profileContent(scenario));
    case 'saved-ideas': return screen('saved', 'Saved weekends', `${pageHeading('MEMORIES', 'Worth doing again', 'Repeat a favorite or remix it for this weekend.')}<sd-saved-card date="May 17–18" title="Lavender and lake weekend" rating="5" highlights="Terre Bleu · Port Credit · family brunch" favourite>${button('Remix it', 'secondary')}</sd-saved-card><sd-saved-card date="April 26–27" title="Rainy-day city adventure" rating="4" highlights="ROM · ramen · board games">${button('Use again', 'secondary')}</sd-saved-card>`);
    case 'event-moderation': return screen('activities', scenario === 'admin' ? 'Moderation' : 'Events', moderationContent(scenario));
    default: return `<sd-empty title="Pattern not found" subtitle="The requested pattern is not in the catalog."></sd-empty>`;
  }
}

export function componentMarkup(component) {
  return component?.examples?.[0]?.markup ?? '<sd-empty title="Example unavailable"></sd-empty>';
}
