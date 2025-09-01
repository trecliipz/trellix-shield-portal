# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/3f4a0dcd-5d30-4d8f-8c0a-b73fdfd79365

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/3f4a0dcd-5d30-4d8f-8c0a-b73fdfd79365) and start prompting.

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

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/3f4a0dcd-5d30-4d8f-8c0a-b73fdfd79365) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Netlify EPO Integration Setup

This project includes a Netlify Functions proxy for secure EPO API access.

### Environment Variables (Required)

Set these in your Netlify dashboard under Site settings > Environment variables:

```
PROXY_URL=https://your-epo-server.com
PROXY_USER=your-epo-username
PROXY_PASS=your-epo-password
```

### Local Development

For local testing with Netlify CLI:

```sh
# Install Netlify CLI
npm install -g netlify-cli

# Create .env file for local development
echo "PROXY_URL=https://your-epo-server.com" >> .env
echo "PROXY_USER=your-epo-username" >> .env  
echo "PROXY_PASS=your-epo-password" >> .env

# Start local development with functions
netlify dev
```

### Usage

The EPO proxy is available at `/.netlify/functions/epo` and supports:

- **GET requests:** `/.netlify/functions/epo?path=remote/core.help`
- **POST requests:** Send JSON body for EPO commands with parameters
- **Timeout control:** `?timeout=30000` (milliseconds)
- **Automatic retry:** Built-in error handling and connection management

### Security Features

- ✅ Credentials stored securely in Netlify environment variables
- ✅ CORS headers included for frontend access
- ✅ Request timeout protection (30s default)
- ✅ Comprehensive error handling and logging
- ✅ Support for both JSON and text EPO responses
