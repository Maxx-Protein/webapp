/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Re-enable ESLint for production builds once configuration is fixed
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Re-enable TypeScript checking for production builds
    ignoreBuildErrors: false,
  },
  experimental: {
    // Removed deprecated serverExternalPackages
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    // External packages handling for server-side
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('node-7z', 'cheerio', 'csv-parser');
    }
    return config;
  },
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
}

module.exports = nextConfig
