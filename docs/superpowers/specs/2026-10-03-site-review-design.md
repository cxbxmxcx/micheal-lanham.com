# Website review implementation

The user approved the eight review recommendations and three reproduced bugs with “fix all issues and republish.” Preserve the amber/teal identity while making the personal site easier to read, navigate, and use. Publishing to the existing GitHub Pages workflow is authorized.

- Compact homepage: concise hero and credentials, services, three selected books, one featured demo, personal introduction, contact.
- Dedicated `/books/`, `/books/:slug/`, `/work/`, `/work/:slug/`, `/demos/`, and `/demos/:slug/` pages. Preserve existing homepage anchors and standalone playable URLs. Unknown paths receive a proper 404 page.
- Book discovery by topic with audience guidance, verified covers where available, clear publisher/retailer destinations, early-access links and honest development states. Preserve verified bibliographic information unless current primary sources establish a correction.
- First-person biography, a verified author photograph if available, public companion code links. No invented client results, testimonials, prices, or delivery promises. Explain how scope and schedule are agreed; provide concrete review inputs, deliverables and a clearly illustrative sample report outline.
- Static readable content; keep restrained hero decoration, remove custom cursor and type-on delays. Readable label sizes, opaque text panels, modest section spacing, native scrolling, reduced-motion support.
- Navigation must retain keyboard focus at the destination, trap focus inside the mobile menu while open, restore toggle focus on dismissal, and work across routes and browser history.
- Mobile demo actions open dedicated full-window pages. Desktop embedding remains optional and must report loading and failure honestly. All five demos remain available.
- Prerender every content route to HTML at build time, hydrate in browser, emit unique metadata, canonical URLs, sitemap, and a real 404. Main content must be usable without JavaScript.
- Fix negative canvas radius, horizontal overflow at narrow widths, and mobile menu focus restoration.
- Verify 320/390/768/1440px layouts, keyboard and reduced-motion navigation, direct route loading, metadata, prerendered HTML, book filtering, demo launch, and browser errors. Build/lint/Helix regression must pass before deploying. Verify published pages after the GitHub Actions run succeeds.
