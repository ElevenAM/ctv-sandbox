---
name: ship
description: Get the current work live at a public URL on Vercel and verify the deployed page actually renders. Use when asked to "ship it", "deploy", "get it hosted", "put it on Vercel", "give me a link", or whenever a prototype needs to be demonstrable to someone who is not at this machine. Handles first-time project linking, env vars, build failures, and post-deploy verification.
---

# /ship

Takes what is on disk and makes it a URL someone else can open. **Not done until you have loaded the deployed page yourself and seen it render.**

The single most important thing this repo does is turn work into a link. An interviewer cannot grade `localhost`.

## Procedure

1. **Gate first.** `pnpm gate`. A red gate means a failed Vercel build two minutes from now — fix it here, where the feedback is faster. Never push through a red gate hoping the cloud disagrees.

2. **Commit.** Everything relevant, on `main` unless the user asked for a branch. Message says what changed, not what you did.

3. **Push.** `git push origin main`. If the Vercel project is already linked to the repo, this deploys on its own — go to step 5.

4. **First deploy only — create and link the project.** Use the Vercel MCP (team `elevenams-projects-85623585`):
   - `create_git_project` pointed at `github.com/ElevenAM/ctv-sandbox`, framework `nextjs`.
   - **Known boundary (observed 2026-09-11):** this MCP connection can *read*
     projects and deployments but `create_git_project` returns
     `403 forbidden — You don't have permission to create the project`. Project
     creation is the owner's to do, once, in the dashboard or with the CLI:
     `npx vercel link` then `npx vercel --prod`. Do not route around it by
     falling back to `deploy_to_vercel` — that makes a bare, git-unlinked
     project, which loses push-to-deploy and is worse than asking. Once the
     project exists and is linked, everything after this step works over MCP.
   - Set the environment variables. **Both are `NEXT_PUBLIC_` and safe to set:**
     - `NEXT_PUBLIC_SUPABASE_URL` = `https://thibkcpuvbskzznconzg.supabase.co`
     - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = the `sb_publishable_…` key from `get_publishable_keys`
     - `NEXT_PUBLIC_SITE_NAME` (optional)
   - **Never set a service-role or `sb_secret_` key.** Nothing in this repo reads one, and a secret in a `NEXT_PUBLIC_` variable ships to every visitor's browser.
   - Add the deployment URL to Supabase auth redirect URLs if the prototype uses auth.

5. **Watch the build.** `list_deployments`, then `get_deployment_build_logs` on the newest. Do not report success off a queued status.
   - **`Missing env var`** → step 4's env vars, then redeploy.
   - **Type or lint error** → it will reproduce locally under `pnpm gate`. Fix, commit, push.
   - **`pnpm install` failure** → the lockfile is out of sync. `pnpm install` locally and commit `pnpm-lock.yaml`.

6. **Open the deployed URL and verify.** Not the build log — the page. Use the Browser tools:
   - The gallery renders and lists the prototypes.
   - Each new prototype's route loads and its primary action works.
   - Check the browser console for errors (`read_console_messages`) — a page that renders while throwing is not working.
   - If it uses the database, confirm data actually round-trips against the hosted Supabase project, not just that the page painted.

7. **Report the URL**, plus anything degraded. If the DB path failed because anonymous sign-in is off, say so and name the fix — do not describe a broken prototype as shipped.

## Invariants

- Verify the deployed page, never just the build status. "The build succeeded" and "it works" are different claims.
- A secret never enters a `NEXT_PUBLIC_` variable, a commit, or a log line.
- Deploys go to this repo's own Vercel project. Never touch another project in the account.
- If the deploy cannot be verified (no browser, protection enabled), say the URL is unverified rather than implying you checked.
