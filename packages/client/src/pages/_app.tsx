import '@/styles/globals.css';

import { HydrationBoundary, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useState } from 'react';
import { Provider as UrqlProvider } from 'urql';

import { Footer } from '@/components/footer';
import Header from '@/components/header';
import { client } from '@/config/api';

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <>
      <Head>
        <title>POKT - Defi Hub</title>
      </Head>
      <UrqlProvider value={client}>
        <QueryClientProvider client={queryClient}>
          <HydrationBoundary state={pageProps.dehydratedState}>
            <Header />
            <Component {...pageProps} />
            <Footer />
            <ReactQueryDevtools initialIsOpen={false} />
          </HydrationBoundary>
        </QueryClientProvider>
      </UrqlProvider>
    </>
  );
}
