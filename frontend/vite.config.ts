import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    proxy: {
      // 이 설정 하나로 `/video/**` 요청이 자동으로 localhost:5000 으로 전달됩니다
      '/video': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/rank': {
        target: 'http://localhost:5000', // 실제 백엔드(Flask)가 실행 중인 주소
        changeOrigin: true,              // Host 헤더를 target에 맞춰 변경
        secure: false,                   // HTTPS가 아닌 경우 false
      },
    },
  },
});
