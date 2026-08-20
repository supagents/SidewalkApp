Sidewalk web app, a [Next.js](https://nextjs.org) project bootstrapped with
[`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

This is just the app shell: Firebase Auth and Firestore are wired up, but
no product features are built yet. See `../project-notes.md` for the plan.

## Getting Started

1. Create a Firebase project (or use an existing one) at the
   [Firebase console](https://console.firebase.google.com/), then enable:
   - **Authentication** (Email/Password and Anonymous sign-in methods)
   - **Firestore Database**
2. In the Firebase console, add a Web app to the project and copy the SDK
   config values.
3. Copy `.env.local.example` to `.env.local` and fill in those values:

   ```bash
   cp .env.local.example .env.local
   ```

4. Install dependencies and run the dev server:

   ```bash
   npm install
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see
the result.

Firebase clients (`auth`, `db`) are initialized in `src/lib/firebase.ts` and
can be imported anywhere in the app.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploying

This app can be deployed to [Vercel](https://vercel.com/new) or
[Firebase Hosting](https://firebase.google.com/docs/hosting). Whichever
you use, set the `NEXT_PUBLIC_FIREBASE_*` environment variables in that
platform's project settings.
