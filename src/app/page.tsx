import { Suspense } from 'react';
import HomeClient from '@/components/HomeClient';

export default function Home() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <HomeClient />
    </Suspense>
  );
}
