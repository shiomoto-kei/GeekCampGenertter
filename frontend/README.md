This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Supabase setup

Create `frontend/.env.local` with values from the **same** Supabase project:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-or-anon-key>
SUPABASE_SECRET_KEY=<server-only-secret-key>
```

`NEXT_PUBLIC_SUPABASE_URL` is the project root URL, not a `/rest/v1/` URL. Never prefix the secret key with `NEXT_PUBLIC_`, or commit `.env.local`.

Run `app/db/db_setup.sql` in that project's SQL Editor. Before using the app with real users, review and apply `app/db/db_security.sql`; it enables RLS and restricts browser access. Coordinate its read/write restrictions with the Home and notification implementations first.

For selectable profile icons, run `app/db/db_add_table.sql` if its schema changes are not yet present, and then run `app/db/db_icon_security.sql` if that policy has not yet been applied. Add rows to `icons` with `name`, `gender`, `generation`, and `image_path`. `image_path` may be an HTTPS URL, a local `/...` public asset path, or an object path inside a public Supabase Storage bucket named `icons` (create the bucket and upload the matching objects first). Without icon rows, profile setup remains available but icon selection is deferred. Posts use the author's current `users.icon_id`; publishing a post never changes the icon.

Run `app/db/db_notifications.sql` after `db_setup.sql` to make notifications private and create them automatically for replies and reactions. This notification-only SQL does not change the Home page's post permissions. The broader `db_security.sql` is still needed before real users can safely use the app.

For Google sign-in, enable the Google provider in Supabase, register that project's Supabase callback URL in the Google Cloud OAuth web client, and allow the local app redirect URL in Supabase Auth URL Configuration.

## Login flow

- Google: `/login` → Supabase OAuth → `/auth/complete` → existing `users.google_sub` goes to `/home`; a new user goes to `/setup?mode=google` and is saved before entering `/home`.
- Guest: `/login` → existing guest cookie is looked up in `users.guest_uuid`; an existing guest goes to `/home`, while a new guest completes `/setup?mode=guest`. The server creates an HttpOnly UUID cookie after successful setup.
- Selecting Guest signs out any current Google session. Guest data is **not** automatically merged into a Google account.
- On My Page, Google logout ends the Supabase session. Returning to the login page as a guest keeps the guest cookie so the same browser can resume its guest identity.
- `GET /api/session?mode=google` requires a Supabase access token in the `Authorization` header. `mode=guest` uses the HttpOnly guest cookie. Both return only public profile fields.

The shared screen gate checks this session API before allowing Home and My Page. A registered guest can use those pages, but Notice requires Google login. Visitors without a registered profile see a dimmed screen and a link to login; this overlay is UX, not a replacement for server-side authorization.

The Notice page reads only the signed-in Google user's notifications via `GET /api/notifications`, and `PATCH /api/notifications` marks that user's notifications read. The footer shows an unread indicator. The DB notification trigger runs after the notification SQL above is applied; earlier replies/reactions are not backfilled.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
