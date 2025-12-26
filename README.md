# Glenn Svanberg - AI Image Generator

This is a Next.js application that generates AI images of Glenn Svanberg using **Gemini (Gemini 2.5 Flash)** and stores them in Supabase.

## Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Gemini API Configuration (Server-side only)
GEMINI_API_KEY=your_gemini_api_key_here

# Where to pick reference photos of Glenn (Supabase Storage)
# Put a handful of Glenn photos in this folder and make the bucket public
# (or accessible with your anon key).
GLENN_REFERENCE_BUCKET=glennsvanberg
GLENN_REFERENCE_FOLDER=glenn-reference

# Where generated images are uploaded (defaults to glennsvanberg)
GENERATED_IMAGES_BUCKET=glennsvanberg

# Optional: override the Gemini model used for image generation/editing
# GEMINI_IMAGE_MODEL=gemini-2.5-flash
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

- 🎨 AI-powered image generation using Gemini with a Glenn reference image
- 📸 Photo gallery with automatic categorization
- ☁️ Supabase storage integration
- 💜 Like and share functionality
- 📱 Responsive design with beautiful UI
- ⚡ No polling required (single request)

## How it Works

1. Enter a creative prompt describing what you want Glenn to be/do
2. The frontend sends the request to our secure API route
3. The server picks a random Glenn reference photo from Supabase (not shown to the user)
4. The server rewrites the prompt under the hood (e.g. “make the person in the image …”)
5. The server calls Gemini to generate an edited image and uploads it to Supabase storage
6. Displays the new Glenn image in the gallery

## Security

- The Gemini API key is kept secure on the server side and never exposed to the client
- All Gemini calls are made through our own secure API routes
- Only the necessary data is passed between client and server

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
