import type { NextConfig } from 'next';
import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // ❌ PWA désactivée en dev
});

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  reactStrictMode: true,

  // 👇 Ajout important pour éviter l'erreur Turbopack
  turbopack: {},

  // Si jamais tu avais des images externes
  images: {
    domains: [],
  },
};

export default withPWA(nextConfig);