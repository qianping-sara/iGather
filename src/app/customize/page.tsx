'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Customize() {
  const router = useRouter();
  
  // 重定向到首页
  useEffect(() => {
    router.replace('/');
  }, [router]);
  
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-xl">正在重定向到首页...</p>
      </div>
    </main>
  );
} 