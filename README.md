This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

Flappy Bird:

In my original version, when clicked to "flap," the code only applied a short-lived negative acceleration (‑300) for a brief moment while gravity (800) was continuously acting. This meant the net acceleration was still positive (downward), so the bird kept falling instead of jumping up.

What I did to fix it:

Immediate Impulse Instead of Temporary Acceleration:
I replaced the temporary acceleration (using the isFlapping state) with an immediate change to the bird’s vertical velocity. When you click, the bird’s velocity is instantly set to a negative value (e.g., -300). This gives the bird a strong upward "kick" that immediately counteracts gravity.

Gravity Continues to Act:
After setting the upward impulse, gravity is applied as normal in the game loop. This means the bird will slow its ascent and eventually start to fall, creating a more responsive jump and fall behavior.

In summary, by directly setting the bird’s vertical velocity to a negative impulse on click, I ensured that the bird got a proper upward boost instead of trying to overcome gravity with a too-small acceleration, thus fixing the falling issue.