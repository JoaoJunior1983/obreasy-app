import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fixa o workspace root para o Turbopack ignorar lockfiles soltos em diretórios ancestrais
  turbopack: {
    root: process.cwd(),
  },

  devIndicators: false, // Remove widget de desenvolvimento Next.js

  poweredByHeader: false,

  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },

  // Ignorar erros durante build (compatibilidade Vercel)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Configuração de variáveis de ambiente
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://blietvjzchjrzbmkitha.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaWV0dmp6Y2hqcnpibWtpdGhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NzM5MzUsImV4cCI6MjA4NTI0OTkzNX0.1MOdgwmLOFlCF89SxmwfrpnVZKu90CL70Oc8KVveSrE',
  },
  

  // Configuração de imagens para principais provedores
  images: {
    remotePatterns: [
      // Unsplash - Banco de imagens gratuitas
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'unsplash.com',
      },
      
      // Supabase Storage
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.com',
      },
      
      // Firebase Storage
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
      
      // AWS S3 e CloudFront
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: 's3.amazonaws.com',
      },
      
      // Vercel Blob
      {
        protocol: 'https',
        hostname: '*.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      
      // Cloudinary
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '*.cloudinary.com',
      },
      
      // Pexels - Banco de imagens gratuitas
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      
      // Pixabay - Banco de imagens gratuitas
      {
        protocol: 'https',
        hostname: 'pixabay.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
      },
      
      // GitHub (avatares, imagens de repos)
      {
        protocol: 'https',
        hostname: 'github.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
      
      // Imgur
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      },
      {
        protocol: 'https',
        hostname: 'imgur.com',
      },
      
      // Google Drive
      {
        protocol: 'https',
        hostname: 'drive.google.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      
      // YouTube thumbnails
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      
      // Vimeo thumbnails
      {
        protocol: 'https',
        hostname: 'i.vimeocdn.com',
      },
      
      // CDNs populares
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
      },
      {
        protocol: 'https',
        hostname: 'unpkg.com',
      },
      
      // Outros provedores populares
      {
        protocol: 'https',
        hostname: '*.uploadthing.com', // UploadThing
      },
      {
        protocol: 'https',
        hostname: '*.imagekit.io', // ImageKit
      },
      {
        protocol: 'https',
        hostname: '*.sanity.io', // Sanity CMS
      },
      {
        protocol: 'https',
        hostname: 'assets.vercel.com', // Vercel assets
      },
      
      // Para desenvolvimento local
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
      },
    ],
    
    // Formatos de imagem suportados
    formats: ['image/webp', 'image/avif'],
    
    // Tamanhos otimizados para diferentes dispositivos
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Configuração experimental para melhor performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  async redirects() {
    return [
      { source: "/lp", destination: "/", permanent: true },
      { source: "/newlp", destination: "/", permanent: true },
    ];
  },

  // Headers para permitir iframe e CORS para plataforma Lasy
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Remover X-Frame-Options para permitir iframe
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          // CSP para permitir iframe da plataforma Lasy
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.lasy.app https://*.lasy.ai https://lasy.app https://lasy.ai",
          },
          // Headers CORS
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With, Accept',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
        ],
      },
    ];
  },
};

export default nextConfig;