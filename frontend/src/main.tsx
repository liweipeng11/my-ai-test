
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/es/locale/zh_CN'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <ConfigProvider locale={zhCN} theme={{
    token: {
      colorPrimary: '#1890ff',
      borderRadius: 6,
    },
  }}>
    <App />
  </ConfigProvider>
)
