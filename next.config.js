/** @type {import('next').NextConfig} */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = (() => {
  try {
    if (!supabaseUrl) return null;
    return new URL(supabaseUrl).hostname;
  } catch {
    return null;
  }
})();

const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdfmake', 'fontkit', 'pdfkit'],
  },
  images: {
    // Custom loader serves Supabase/remote images directly (avoids /_next/image 402 errors).
    loader: "custom",
    loaderFile: "./src/lib/imageLoader.ts",
    formats: ["image/avif", "image/webp"],
    domains: [
      "source.unsplash.com",
      "images.unsplash.com",
      "ext.same-assets.com",
      "ugc.same-assets.com",
      "i.ytimg.com",
      "via.placeholder.com",
      ...(supabaseHostname ? [supabaseHostname] : []),
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "source.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ext.same-assets.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ugc.same-assets.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
        pathname: "/**",
      },
      ...(supabaseHostname
        ? [
            {
              protocol: "https",
              hostname: supabaseHostname,
              pathname: "/**",
            },
          ]
        : []),
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    // Handle the applyDecoratedDescriptor import issue by ignoring fontkit
    config.resolve.alias = {
      ...config.resolve.alias,
      "fontkit": false,
    };

    config.module.rules.push({
      test: /\.m?js/,
      resolve: {
        fullySpecified: false,
      },
    });

    return config;
  },
};

module.exports = nextConfig;