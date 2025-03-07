'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const [userName, setUserName] = useState('');
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-5xl font-bold mb-8 text-blue-500">iGather</h1>
        <p className="text-xl mb-8">
          欢迎来到iGather虚拟空间！在这里，你可以创建自己的数字分身，
          在小镇场景中自由探索，结交新朋友。
        </p>
        
        <div className="bg-white/10 p-8 rounded-xl shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4">请输入你的名字</h2>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="输入你的名字"
            className="w-full p-3 rounded-lg mb-4 bg-gray-700 text-white"
          />
          
          <Link 
            href="/customize"
            className={`block w-full py-3 px-6 rounded-lg ${
              userName.trim() 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-gray-500 cursor-not-allowed'
            } text-white font-medium transition`}
            onClick={(e) => !userName.trim() && e.preventDefault()}
          >
            继续
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">自定义角色</h3>
            <p>选择你的数字分身外观，让自己独一无二</p>
          </div>
          <div className="bg-white/10 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">小镇探索</h3>
            <p>在宁静美丽的小镇虚拟场景中自由探索</p>
          </div>
          <div className="bg-white/10 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">互动交流</h3>
            <p>与其他用户或NPC进行实时互动和交流</p>
          </div>
        </div>
      </div>
    </main>
  );
} 