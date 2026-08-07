import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

const client = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
})

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster
        position="top-center"
        containerStyle={{ zIndex: 'var(--z-toast)' }}
        toastOptions={{
          duration: 4500,
          className: '!rounded-[var(--radius-lg)] !border !text-[13px] !font-medium',
          style: {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            borderColor: 'var(--border-default)',
            boxShadow: 'var(--shadow-float)',
          },
          success: {
            iconTheme: { primary: '#16a34a', secondary: '#fff' },
            style: { borderColor: 'rgb(22 163 74 / 0.35)' },
          },
          error: {
            iconTheme: { primary: '#e11d48', secondary: '#fff' },
            style: { borderColor: 'rgb(225 29 72 / 0.35)' },
          },
        }}
      />
    </QueryClientProvider>
  )
}
