import axios from 'axios';

// ===== Khởi tạo axiosClient với baseURL động =====
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Log để debug
if (typeof window !== 'undefined') {
  console.log('🌐 API URL:', baseURL);
}

const axiosClient = axios.create({
  baseURL,
  timeout: 10000, // 10s timeout mặc định
  withCredentials: true,
});

// ===== Interceptor: Tự động gắn token vào header =====
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Log request để debug
  console.log('📡 API Request:', config.method?.toUpperCase(), config.url);

  return config;
});

// ===== Interceptor: Xử lý lỗi response =====
axiosClient.interceptors.response.use(
  (response) => {
    // Log success response
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    // Log error response
    console.error('❌ API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.response?.data?.message || error.message,
    });

    // Handle specific errors
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
