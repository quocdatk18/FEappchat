/** @type {import('next').NextConfig} */
const nextConfig = {
  // Xuất static cho Netlify (thay cho `next export`)
  output: 'export',

  // Nếu dùng image ngoài (CDN) phải khai báo domain
  images: {
    unoptimized: true, // bắt buộc cho static export
  },

  // Biến môi trường để dùng trong client
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
  },

  // Bật strict mode để bắt lỗi tốt hơn
  reactStrictMode: true,

  // Cho phép import file kiểu TS/JS mở rộng
  experimental: {
    typedRoutes: true,
  },
};

module.exports = nextConfig;
