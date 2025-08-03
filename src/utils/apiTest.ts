import axiosClient from '@/api/axiosClient';

export const testApiConnection = async () => {
  try {
    console.log('🧪 Testing API connection...');
    
    // Test 1: Kiểm tra base URL
    console.log('Base URL:', axiosClient.defaults.baseURL);
    
    // Test 2: Kiểm tra environment variables
    console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    // Test 3: Test simple API call
    const response = await axiosClient.get('/auth/me');
    console.log('✅ API connection successful:', response.status);
    
    return true;
  } catch (error) {
    console.error('❌ API connection failed:', error);
    return false;
  }
};

export const testLogin = async (username: string, password: string) => {
  try {
    console.log('🧪 Testing login...');
    
    const response = await axiosClient.post('/auth/login', {
      username,
      password,
    });
    
    console.log('✅ Login successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Login failed:', error);
    throw error;
  }
};

export const testSocketConnection = () => {
  try {
    console.log('🧪 Testing Socket connection...');
    
    // Import socket dynamically to avoid SSR issues
    import('@/api/socket').then(({ default: socket }) => {
      console.log('Socket URL:', socket.io.uri);
      
      socket.on('connect', () => {
        console.log('✅ Socket connected:', socket.id);
      });
      
      socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
      });
      
      socket.connect();
    });
  } catch (error) {
    console.error('❌ Socket test failed:', error);
  }
}; 