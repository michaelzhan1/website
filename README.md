# Michael's Website

This is the repo behind my website hosted at [mzhan.dev](https://mzhan.dev). It's built on [Astro](https://astro.build/), which is a nifty and minimalist HTML-forward site builder.

## Project Structure

One (opinionated) aspect of Astro is that certain folders tend to have special meanings.

```text
/
├── public/                 <-- publicly accessible files
├── src/
│   ├── assets/
│   ├── components/
│   ├── content/            <-- reserved location for content loaded by astro:content
│   ├── icons/              <-- reserved location for icons loaded by astro:icon
│   ├── layouts/
│   ├── pages/              <-- reserved location for .astro files to define routes
│   ├── styles/
│   └── utils/
└── package.json
```

## Development

Development is pretty simple, with `npm run dev` to spin up the site at `localhost:4321` and `npm run build` to build locally. Astro commands are available through `npm run astro`, see the documentation to see what's available.

## Deployment

This site is deployed using GitHub actions, using the `withastro/action` Action to build and upload the actual site for GitHub pages to deploy.
