# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Vitest (testing)

## Development

### Prerequisites

- Node.js >= 18.0.0 (recommended: use [nvm](https://github.com/nvm-sh/nvm) to manage versions)
- npm
- Backend API running (see `../backend/README.md`)

### Environment Variables

Copy `.env.example` to `.env` and configure:

```sh
cp .env.example .env
```

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:8000/api/v1` |

### Running the Development Server

```sh
# Install dependencies
npm install

# Start the dev server with hot reload
npm run dev
```

**Note:** Make sure the backend server is running on port 8000 for the API to work.

### Running Both Frontend and Backend

From the project root, you can use the Makefile:

```sh
# Run both servers in parallel
make dev
```

The development server will start at `http://localhost:5173` (or the next available port).

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run build:dev` | Build for development |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint to check code quality |
| `npm run test` | Run unit tests once |
| `npm run test:watch` | Run unit tests in watch mode |

### Running Tests

This project uses [Vitest](https://vitest.dev/) with [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for unit testing.

```sh
# Run all tests once
npm run test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch
```

Test files are located alongside the source files with the `.test.ts` or `.test.tsx` extension:

```
src/
├── components/
│   ├── PrescriptionForm.tsx
│   ├── PrescriptionForm.test.tsx
│   ├── SuccessScreen.tsx
│   ├── SuccessScreen.test.tsx
│   └── ...
├── contexts/
│   ├── LanguageContext.tsx
│   └── LanguageContext.test.tsx
└── lib/
    ├── utils.ts
    └── utils.test.ts
```

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
