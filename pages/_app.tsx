import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { ToastProvider } from '@/components/ui/Toast'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Component {...pageProps} />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}