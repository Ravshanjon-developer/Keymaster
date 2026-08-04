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
        toastOptions={{
          duration: 4500,
          className:
            'text-[13px] font-medium !rounded-xl !bg-white !text-ink !border !border-black/8 !shadow-[0_12px_40px_-16px_rgba(10,22,40,0.35)] dark:!bg-[#0c1420] dark:!text-slate-100 dark:!border-white/10',
          success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
          error: { iconTheme: { primary: '#e11d48', secondary: '#fff' } },
        }}
      />
    </QueryClientProvider>
  )
}
