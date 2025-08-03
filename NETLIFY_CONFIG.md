# Cấu hình Netlify Deployment

## Environment Variables cần thiết

Để deployment lên Netlify hoạt động đúng, bạn cần cấu hình các environment variables sau trong Netlify:

### 1. Trong Netlify Dashboard:

- Vào **Site settings** > **Environment variables**
- Thêm các biến sau:

```
NEXT_PUBLIC_API_URL=https://beappchat.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://beappchat.onrender.com
NODE_ENV=production
```

### 2. Build Settings:

- **Build command:** `npm run build`
- **Publish directory:** `out`
- **Node version:** `18` hoặc `20`

### 3. Redirects (nếu cần):

Tạo file `_redirects` trong thư mục `public`:

```
/*    /index.html   200
```

## Kiểm tra sau khi deploy:

1. **Mở Developer Tools** (F12)
2. **Kiểm tra Console** xem có lỗi gì không
3. **Kiểm tra Network tab** xem API calls có được gửi không
4. **Kiểm tra Environment variables** bằng cách log ra console

## Debug nếu có vấn đề:

1. Kiểm tra `console.log('🌐 API URL:', baseURL);` trong browser console
2. Kiểm tra `console.log('Socket URL:', process.env.NEXT_PUBLIC_SOCKET_URL);`
3. Đảm bảo CORS được cấu hình đúng ở backend
4. Kiểm tra token trong localStorage

## Lưu ý:

- Environment variables phải bắt đầu bằng `NEXT_PUBLIC_` để client có thể truy cập
- Backend URL phải hỗ trợ HTTPS
- Socket.IO URL phải giống với API URL
