# zonenwang.com

Personal portfolio of Zonen Wang, served by GitHub Pages from this repository (`main` branch, repository root).

## Structure

| Path | What it is |
| --- | --- |
| `index.html`, `about.html`, `photography.html` | Main pages |
| `mesh.html`, `beyond.html`, `tteh.html`, `mr.html`, `brain.html`, `mars.html` | Project pages (served as `/mesh`, `/beyond`, …) |
| `assets/css/base.css` | Hand-written layout, menu, lightbox and slider styles |
| `assets/css/site.css` | Generated: fonts + `base.css` + shared text styles |
| `assets/js/site.js` | Scaling, lazy video, parallax, menus, lightbox, slider, chapter menu |
| `assets/img`, `assets/media`, `assets/video` | Images (WebP), converted GIFs (MP4), videos (MP4) |
| `assets/embed` | Custom HTML embeds (featured cards, name animation, footer) |
| `404.html`, `robots.txt`, `sitemap.xml` | Standard site files |

Each page contains two layouts that mirror the original Wix design exactly: a 1440 px desktop canvas (`.D`)
and a 320 px mobile canvas (`.M`, used below 768 px). Both are scaled to the window width with CSS `zoom`,
so the composition stays identical at any size.

## Editing

- **Text:** edit the text inside the page's `.html` file. Change it in both the `.D` (desktop) and `.M`
  (mobile) blocks. Positions are absolute, so keep edits similar in length or adjust the following elements' `top`.
- **Images:** replace a file in `assets/img` with one of the same name and aspect ratio.
- Push to `main` and the site updates in about a minute.

## Fonts

Poppins and Barlow are self-hosted (SIL Open Font License). GT Walsheim Pro and Avantt are loaded from the
owner's Wix font storage and are not included in this repository.
