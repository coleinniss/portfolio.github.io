# Cole Inniss — Portfolio

A plain HTML/CSS/JS website. No build step and no dependencies, so you can upload the folder as-is to any static host.

## Folder structure

```
cole-inniss-portfolio/
├── index.html                  Landing page (Work)
├── work/
│   └── connections/
│       └── index.html          Case study: Connections onboarding
├── fun/
│   └── index.html              Fun page
├── 404.html                    "Page not found"
├── assets/
│   ├── css/
│   │   ├── base.css            Shared: type, grain, links, highlights, waves, toucan, previews, contact pop-up
│   │   ├── home.css            Landing only: tagline carousel, About toggle, project cards
│   │   ├── case-study.css      Case study only
│   │   └── fun.css             Fun page only
│   ├── js/
│   │   ├── site.js             Shared: wavy underlines, selection highlight, toucan cursor, page transitions, contact pop-up
│   │   └── home.js             Landing only: rotating tagline, About me expand/collapse
│   ├── img/
│   │   ├── grain.svg           Background noise texture
│   │   ├── resume-preview.webp Thumbnail shown when hovering "Resume"
│   │   └── favicon.svg
│   └── files/
│       └── Cole-Inniss-Resume.pdf
└── README.md
```

## Preview on your computer

Double-clicking `index.html` works. For the most accurate preview, run a tiny local server from this folder:

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Publish

Any static host works. For example:

- **Netlify:** drag the whole folder onto app.netlify.com/drop.
- **GitHub Pages:** push the folder to a repo, then Settings → Pages → deploy from the main branch.
- **Vercel:** `npx vercel` from inside the folder.

## Common edits

- **Add a case study:** copy `work/connections/` to `work/<new-name>/`, edit its `index.html`, and point a project card in `index.html` at it (`href="work/<new-name>/index.html"`). Keep `data-transition` on the link for the smooth page fade.
- **Replace an image placeholder:** swap the green `<div role="img" …>` for `<img src="…" alt="…">` and put the file in `assets/img/`.
- **Update the resume:** replace `assets/files/Cole-Inniss-Resume.pdf` (keep the name) and `assets/img/resume-preview.webp`.
- **Change the rotating tagline:** edit the `TAGLINES` list at the top of `assets/js/home.js`.
- **Turn off the toucan cursor:** delete the `<div class="toucan-cursor" id="toucan">…</div>` block from a page and remove `toucan-scope` from its `page-root` class.

## Notes

- The Email pop-up opens the visitor's email app with their note filled in. To receive messages directly, connect a form service such as Formspree or Netlify Forms to the form in each page.
- Fonts load from Google Fonts (PT Serif, Noto Sans, Noto Sans Display).
