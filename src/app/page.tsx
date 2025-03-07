'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAvatarStore } from '../store/avatarStore';
import { useSceneStore } from '../store/sceneStore';

export default function Home() {
  const [userName, setUserName] = useState('');
  const { availableAvatars, selectedAvatar, setSelectedAvatar } = useAvatarStore();
  const { setSelectedScene } = useSceneStore();
  
  // 添加分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 12; // 每页显示12个角色
  
  // 过滤和分页处理
  const filteredAvatars = availableAvatars.filter(avatar => 
    avatar.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredAvatars.length / itemsPerPage);
  const paginatedAvatars = filteredAvatars.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // 当搜索条件变化时，重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);
  
  // 生成页码数组
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }
  
  // 自动选择小镇场景
  useEffect(() => {
    setSelectedScene('town');
  }, [setSelectedScene]);
  
  return (
    <main className="min-h-screen p-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-bold mb-8 text-center text-blue-500">iGather</h1>
        <p className="text-xl mb-8 text-center">
          欢迎来到iGather虚拟空间！在这里，你可以创建自己的数字分身，
          在小镇场景中自由探索，结交新朋友。
        </p>
        
        <div className="bg-white/10 p-6 rounded-xl shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4">请输入你的名字</h2>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="输入你的名字"
            className="w-full p-3 rounded-lg mb-4 bg-gray-700 text-white"
          />
        </div>
        
        <div className="bg-white/10 p-6 rounded-xl shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4">选择你的数字分身</h2>
          
          {/* 添加搜索框 */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="搜索角色..."
              className="w-full p-2 bg-gray-700 rounded-lg text-white text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* 角色网格 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {paginatedAvatars.map((avatar) => (
              <div 
                key={avatar.id}
                className={`bg-white/10 p-2 rounded-lg cursor-pointer transition hover:bg-white/20 ${
                  selectedAvatar === avatar.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedAvatar(avatar.id)}
              >
                <div className="aspect-square bg-gray-800 rounded-md flex items-center justify-center">
                  <img 
                    src={avatar.image} 
                    alt={avatar.name} 
                    className="w-full h-full object-contain p-1"
                  />
                </div>
                <h3 className="text-xs font-medium text-center truncate mt-1">{avatar.name}</h3>
              </div>
            ))}
          </div>
          
          {/* 分页控件 */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4 space-x-1 text-sm">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-2 py-1 rounded ${
                  currentPage === 1 ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                上一页
              </button>
              
              {pageNumbers.map(number => (
                <button
                  key={number}
                  onClick={() => setCurrentPage(number)}
                  className={`px-2 py-1 rounded ${
                    currentPage === number ? 'bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
                >
                  {number}
                </button>
              ))}
              
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-2 py-1 rounded ${
                  currentPage === totalPages ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                下一页
              </button>
            </div>
          )}
        </div>
        
        <div className="mt-6 flex justify-center">
          <Link 
            href="/world"
            className={`px-8 py-3 rounded-lg font-medium transition ${
              userName.trim() && selectedAvatar
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gray-500 cursor-not-allowed text-white'
            }`}
            onClick={(e) => (!userName.trim() || !selectedAvatar) && e.preventDefault()}
          >
            进入Haiven小镇
          </Link>
        </div>
      </div>
    </main>
  );
} 