# Writing Practice Platform

A Next.js landing page + Writing Task 1 / Task 2 workspace.

## Features
- Hidden student access-code validation on the server
- Monthly code expiration using `ACCESS_CODES_MONTH`
- Task 1 / Task 2 tabs
- 60-minute countdown
- Live word count
- Local autosave
- Download answers as a text file
- Grammar and vocabulary suggestions after pressing Finish and check
- Responsive desktop/mobile layout

The feedback checks a defined set of common grammar, spelling, and phrase patterns. It does not generate an IELTS score or catch every error. Both answers remain on the student's device; the feedback request processes them without storing them on this server.

## Monthly code change
In Vercel > Project > Settings > Environment Variables, update:
- `ACCESS_CODES_MONTH` to the new `YYYY-MM`
- `ACCESS_CODES_CURRENT` to the new comma-separated codes

Old codes automatically stop working because the API only accepts codes when `ACCESS_CODES_MONTH` matches the current UTC month.
Set `ACCESS_TOKEN_SECRET` to a random string of at least 32 characters in all deployed environments. Run `node scripts-generate-codes.mjs YYYY-MM` to generate a new month's codes; set the printed environment variables in the deployment and share codes privately with students. Never commit live codes or the secret.

This repository is based on the available source archive. Check it against the currently deployed Vercel project before connecting automatic production deployments, since the live version may contain later changes.

## Create a new deployment from GitHub
1. Open [New Project on Vercel](https://vercel.com/new) and import `AIProjectsaaaaaa/writingplatform` as a **new** project. Keep the repository root as the project root.
2. Before deploying, set `ACCESS_CODES_MONTH` to the current UTC month (for example, `2026-09`). Run `node scripts-generate-codes.mjs YYYY-MM` privately and put the generated `ACCESS_CODES_CURRENT` value in the project settings.
3. Generate a random secret of at least 32 characters for `ACCESS_TOKEN_SECRET`. Keep it private. Set all three variables for Production, then deploy.
4. Test the new URL with one of the generated codes and a short answer. The old Vercel project is separate.

GitHub Pages cannot host this application as it uses server-side code validation and POST feedback routes. Do not publish real codes or the signing secret in this public repository.

## Run locally
```bash
npm install
cp .env.example .env.local
npm run dev
```
