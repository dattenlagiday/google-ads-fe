import mongoose from 'mongoose';

// 1. Lấy Connection String từ biến môi trường
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Vui lòng định nghĩa biến MONGODB_URI trong file .env');
}

// 2. Định nghĩa interface cho Cache để TypeScript không báo lỗi
// Mục đích: Lưu kết nối vào biến Global để tái sử dụng khi hot-reload
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Mở rộng Global object của NodeJS
declare global {
  var mongoose: MongooseCache;
}

// 3. Khởi tạo biến cache
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

// 4. Hàm connect chính
export const connectToDB = async () => {
  // Nếu đã có kết nối rồi thì dùng luôn, không kết nối lại
  if (cached.conn) {
    console.log('⚡️ Sử dụng kết nối MongoDB có sẵn.');
    return cached.conn;
  }

  // Nếu chưa có kết nối nhưng đang trong quá trình kết nối (Promise đang chạy)
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Tắt buffer để lỗi văng ra ngay nếu mất kết nối
      dbName: 'google-ads-manager', // Tên Database của bạn (Tùy chọn)
    };

    console.log('⏳ Đang tạo kết nối MongoDB mới...');

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      console.log('✅ Đã kết nối MongoDB thành công!');
      return mongoose;
    });
  }

  // Chờ Promise hoàn thành và lưu vào cache
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
};
