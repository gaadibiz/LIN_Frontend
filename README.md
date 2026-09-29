# LIN Frontend (LoanInNeed)

This is the frontend repository for the LoanInNeed (LIN) application. It is built with [Next.js](https://nextjs.org) (v15) and React 19, utilizing a modern, scalable stack for optimal performance and developer experience.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org) (App Router)
- **Language:** TypeScript
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com), [Styled Components](https://styled-components.com)
- **UI Components:** [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/) (Icons), [Framer Motion](https://www.framer.com/motion/) (Animations)
- **Forms & Validation:** [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/), [TanStack Form](https://tanstack.com/form/latest)
- **State & Data Fetching:** [TanStack Query](https://tanstack.com/query/latest) (React Query)
- **CMS Integration:** [Sanity](https://www.sanity.io/)

## Getting Started

First, ensure you have Node.js installed. Then, install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `app/` - Next.js App Router pages and layouts.
- `components/` - Reusable UI components.
- `lib/` - Utility functions and shared library configurations.
- `hooks/` - Custom React hooks.
- `sanity/` - Sanity CMS configuration and schemas.
- `public/` - Static assets.

## Scripts

- `npm run dev` - Starts the development server using Turbopack.
- `npm run build` - Builds the application for production.
- `npm run start` - Starts the production server.
- `npm run lint` - Runs ESLint to check for code issues.
- `npm run sanity:deploy` - Deploys the Sanity Studio.
