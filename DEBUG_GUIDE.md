# 🐛 Debug Guide - API Issues

## 🔍 Vấn đề: Frontend không gửi được request nào

### **Nguyên nhân có thể:**

1. **Environment Variables không được cấu hình**
2. **CORS issues**
3. **Backend không accessible**
4. **Network issues**

## 🛠️ Các bước debug:

### **Bước 1: Kiểm tra Environment Variables**

Mở **Developer Tools (F12)** → **Console** và chạy:

```javascript
// Kiểm tra environment variables
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
```

### **Bước 2: Kiểm tra API URL**

Trong console, bạn sẽ thấy log:

```
🌐 API URL: http://localhost:5000
```

Nếu hiển thị `http://localhost:5000` thay vì URL production, có nghĩa là environment variables chưa được cấu hình.

### **Bước 3: Test API Connection**

Trong console, chạy:

```javascript
// Test API connection
fetch('/auth/me')
  .then((r) => r.json())
  .then(console.log)
  .catch(console.error);
```

### **Bước 4: Kiểm tra Network Tab**

1. Mở **Developer Tools** → **Network tab**
2. Thực hiện một action (login, send message, etc.)
3. Xem có request nào được gửi không
4. Kiểm tra **Status** và **Response**

## 🔧 Các sửa đổi đã thực hiện:

### **1. Thống nhất sử dụng axiosClient**

- ✅ Thay thế `axios` trực tiếp bằng `axiosClient`
- ✅ Thay thế `fetch` bằng `axiosClient`
- ✅ Đảm bảo tất cả API calls đều qua `axiosClient`

### **2. Thêm logging**

- ✅ Log API URL khi khởi tạo
- ✅ Log tất cả requests và responses
- ✅ Log errors chi tiết

### **3. Cải thiện error handling**

- ✅ Handle 401 errors tự động
- ✅ Clear token khi unauthorized
- ✅ Redirect to login khi cần

## 🚨 Cấu hình cần thiết trên Netlify:

### **Environment Variables:**

```bash
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
NODE_ENV=production
NEXT_PUBLIC_SOCKET_URL=https://your-backend-domain.com
```

### **Backend CORS config:**

```javascript
app.use(
  cors({
    origin: ['https://your-netlify-app.netlify.app', 'http://localhost:3000'],
    credentials: true,
  })
);
```

## 📋 Checklist để fix:

- [ ] Đã cấu hình `NEXT_PUBLIC_API_URL` trên Netlify
- [ ] Đã cấu hình `NODE_ENV=production` trên Netlify
- [ ] Backend đang chạy và accessible
- [ ] Backend đã cấu hình CORS cho domain Netlify
- [ ] Đã deploy lại sau khi thêm environment variables
- [ ] Đã test trong browser console

## 🔍 Test commands:

```javascript
// Test API connection
fetch('/auth/me')
  .then((r) => r.json())
  .then(console.log);

// Test environment variables
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);

// Test login
fetch('/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'test', password: 'test' }),
})
  .then((r) => r.json())
  .then(console.log);
```
