import type { NextConfig } from 'next';

// ⚠️ next-pwa n'est pas bien typé → require obligatoire
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // PWA désactivée en dev
});

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // ✅ Évite l'erreur Turbopack / webpack
  turbopack: {},

  images: {
    domains: [],
  },
};

export default withPWA(nextConfig);