'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAvatarStore } from '../../store/avatarStore';
import { useSceneStore } from '../../store/sceneStore';

export default function Customize() {
  const { availableAvatars, selectedAvatar, setSelectedAvatar } = useAvatarStore();
  const { availableScenes, selectedScene, setSelectedScene } = useSceneStore();
  
  // 添加分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 24; // 增加到每页显示24个角色
  
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
  
  return (
    <main className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">自定义你的虚拟体验</h1>
        
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">选择你的数字分身</h2>
          
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
          
          {/* 角色网格 - 调整为更紧凑的网格 */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12 gap-2">
            {paginatedAvatars.map((avatar) => (
              <div 
                key={avatar.id}
                className={`bg-white/10 p-1.5 rounded-lg cursor-pointer transition hover:bg-white/20 ${
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
        
        {/* 地图选择 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">选择场景地图</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableScenes.map((scene) => (
              <div 
                key={scene.id}
                className={`bg-white/10 p-4 rounded-lg cursor-pointer transition hover:bg-white/20 ${
                  selectedScene === scene.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedScene(scene.id)}
              >
                <div className="aspect-video bg-gray-800 rounded-md overflow-hidden mb-2">
                  <img 
                    src={scene.image} 
                    alt={scene.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-lg font-medium mb-1">{scene.name}</h3>
                <p className="text-sm text-gray-300">{scene.description}</p>
              </div>
            ))}
          </div>
        </div>
          
        <div className="mt-6 flex justify-center">
          <Link 
            href="/world"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            进入虚拟世界
          </Link>
        </div>
      </div>
    </main>
  );
} 