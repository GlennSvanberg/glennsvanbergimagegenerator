# Glenn Svanberg - AI Image Generator

This is a Next.js application that generates AI images of Glenn Svanberg using the Flux API and stores them in Supabase.

## Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Black Forest Labs (Flux) API Configuration (Server-side only)
# Get your API key from: https://api.bfl.ml/
BFL_API_KEY=your_bfl_api_key_here
```

## Getting Started

First, install dependencies and run the development server:

```bash
npm install
npm run dev
# or
yarn install && yarn dev
# or
pnpm install && pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- 🎨 AI-powered image generation using Flux API with Glenn Svanberg finetune
- 📸 Photo gallery with automatic categorization
- ☁️ Supabase storage integration
- 💜 Like and share functionality
- 📱 Responsive design with beautiful UI
- ⚡ Real-time polling for image generation status

## How it Works

1. Enter a creative prompt describing Glenn in different scenarios
2. The frontend sends the request to our secure API route
3. The server-side API calls Flux API with the Glenn Svanberg finetune model
4. Polls every 500ms for generation completion on the server
5. Downloads and uploads the generated image to Supabase storage
6. Displays the new Glenn image in the gallery

## Security

- The BFL API key is kept secure on the server side and never exposed to the client
- All Flux API calls are made through our own secure API routes
- Only the necessary data is passed between client and server

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
