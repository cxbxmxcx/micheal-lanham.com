# micheal-lanham.com

Personal site for Micheal Lanham — author, AI agents and evolutionary computation.

## Structure

- `index.html` — the entire site. Self-contained: CSS and JS are inline, Google Fonts is
  the only external dependency. No build step.
- `demos/` — three interactive Unity WebGL teaching games, migrated from
  `cxbxmxcx.github.io`: the Perceptron, Multilayer Perceptron, and Autoencoder games.
- `.nojekyll` — serve files as-is, skip Jekyll processing.
- `CNAME` — custom domain for GitHub Pages (added at DNS cutover).

## Editing

Open `index.html` and edit. To preview locally:

    python -m http.server 8765

then visit http://127.0.0.1:8765/

Paths are relative throughout, so the site works both at a GitHub project URL and at
the apex domain.

## Licence

GPL-3.0, carried over from the original repository.
