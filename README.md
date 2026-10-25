# zonenwang.com

Personal portfolio of Zonen Wang, served by GitHub Pages from this repository (`main` branch, repository root).

## Structure

| Path | What it is |
| --- | --- |
| `index.html`, `about.html`, `photography.html` | Main pages |
| `mesh.html`, `beyond.html`, `tteh.html`, `mr.html`, `brain.html`, `mars.html` | Project pages (served as `/mesh`, `/beyond`, …) |
| `soft.html`, `kayak.html` | Other projects pages (`tools/g_other.py`) |
| `assets/css/base.css` | Hand-written layout, menu, lightbox and slider styles |
| `assets/css/site.css` | Generated: fonts + `base.css` + shared text styles |
| `assets/js/site.js` | Scaling, lazy video, parallax, menus, lightbox, slider, chapter menu, analytics events, footer line network |
| `assets/img`, `assets/media`, `assets/video` | Images (WebP), converted GIFs (MP4), videos (MP4) |
| `assets/img/about` | Generated About images: evidence frames and project logo chips (`tools/g_about.py`) |
| `assets/img/zonen-wordmark.png` | Mask for the gradient name after "Hi, I am" on home |
| `assets/embed` | Custom HTML embeds (featured project cards, scroll hint) |
| `404.html`, `robots.txt`, `sitemap.xml` | Standard site files |

Each page contains two layouts that mirror the original Wix design exactly: a 1440 px desktop canvas (`.D`)
and a 320 px mobile canvas (`.M`, used below 768 px). Both are scaled to the window width with CSS `zoom`,
so the composition stays identical at any size.

## Editing

- **Text:** edit the text inside the page's `.html` file. Change it in both the `.D` (desktop) and `.M`
  (mobile) blocks. Positions are absolute, so keep edits similar in length or adjust the following elements' `top`.
- **Images:** replace a file in `assets/img` with one of the same name and aspect ratio.
- Push to `main` and the site updates in about a minute.

## Analytics

Every page (not the embeds) loads the cookieless [Umami Cloud](https://cloud.umami.is) tracker, which records
page views, referrers, UTM tags, location and device. `site.js` adds these events:

| Event | When |
| --- | --- |
| `time-on-page` | The visitor leaves or switches away after looking at a page for 10 s or more. `seconds` counts only visible, non-idle time (idle = 5+ minutes without input); `scroll` is the furthest point reached (%). |
| `showreel-open` | The showreel is opened |
| `email-click`, `linkedin-click`, `outbound-click` | Email, LinkedIn and other external links (`url`) |

Opening any page with `#notrack` stops counting visits from that browser; `#track` resumes.

## Fonts

Poppins and Barlow are self-hosted (SIL Open Font License). GT Walsheim Pro and Avantt are loaded from the
owner's Wix font storage and are not included in this repository.
