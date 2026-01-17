const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // Désactive en dev
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tes autres configurations ici
};

module.exports = withPWA(nextConfig);