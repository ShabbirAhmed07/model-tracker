# AI Insta Model Tracker

An independent AI model observation dashboard for GitHub Pages. It monitors the public models.dev catalog and the 100 most recently created public Hugging Face model repositories for each selected organization. It does not use or copy the reference tracker's feed or code.

## What it tracks

- The first successful scan seeds a baseline and displays up to 60 recent listings per source, labeled **baseline listing**. These are not claimed as new discoveries.
- Later scans flag newly observed identifiers and changes to the displayed metadata. Existing observations and baselines survive source failures. Removed records are not treated as releases or alerts.
- The feed retains up to 1,000 observations. Source health shows errors and flags a source as stale after six hours. The dashboard supports search, filters, source links, copy link, and browser-local read markers.
- **Create post** previews a 1200 x 675 AI Insta-branded PNG. Download the image and open the prepared X draft, then attach the downloaded image yourself and review before posting. The X compose link cannot attach the image, and this project does not post automatically or access your X credentials.
- A catalog listing, repository, or open-weights flag is not proof of model availability, ownership, licensing, or a new release. Models.dev is a community catalog; Hugging Face organization ownership identifies a repository account, not necessarily the model creator.
- Hugging Face polling is limited to the newest 100 repositories per configured organization, sorted by creation date. It may miss older repositories made public later, records that appear and disappear between scans, or bursts exceeding that limit. The models.dev collector covers its public catalog, not private or unannounced model listings. It does not inspect binaries, issue leaks, send Discord alerts, or reproduce all reference sources.

## Run locally

Requires Node.js 22 or later. No npm dependencies or API keys are needed.

```sh
npm test
npm run scan
npm run dev
```

Open http://127.0.0.1:5180/. The scanner writes `data/state.json` (persistent baselines) and `data/feed.json` (public dashboard data). Keep both files when moving the project to GitHub. Do not edit the baseline by hand. A missing baseline starts a fresh baseline rather than declaring the entire catalog new.

Behind a corporate proxy, configure Node's supported `HTTPS_PROXY` and `NODE_USE_ENV_PROXY=1` environment variables before scanning; do not put credentials in the repository.

## Publish on GitHub Pages

1. Create a new **public** GitHub repository named `model-tracker` under `ShabbirAhmed07`, without initializing it with a README.
2. From this project directory, create the initial commit and push it:

   ```sh
   git init -b main
   git add .
   git commit -m "Create Model Signal tracker"
   git remote add origin https://github.com/ShabbirAhmed07/model-tracker.git
   git push -u origin main
   ```

3. In the repository's **Settings → Pages**, select **GitHub Actions** as the build and deployment source. Make sure Actions is enabled and allows the workflow to write repository contents.
4. Open **Actions → Scan and publish**, and run the workflow manually if the initial push ran before Pages was enabled. When deployment completes, the expected site URL is `https://shabbirahmed07.github.io/model-tracker/`.

The workflow scans on push, manually, and every two hours on a best-effort schedule. GitHub may delay or drop scheduled runs and can disable schedules after 60 days of repository inactivity. It commits generated data to the default branch and deploys a static Pages artifact directly, so a bot commit does not need to trigger a second workflow. Concurrent human pushes can cause the bot push to fail; rerun the workflow after resolving the conflict. Source-health status and timestamps expose failed or stale scans.

## Tests

`npm test` covers source normalization, initial seeding, additions, metadata changes, and preserving baselines on failure. Extend `tracker/sources.mjs` and its tests when adding sources; only add public endpoints you are allowed to query.