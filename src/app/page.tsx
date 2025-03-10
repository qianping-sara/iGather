'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAvatarStore } from '../store/avatarStore';
import { useSceneStore } from '../store/sceneStore';
import { useUserStore } from '../store/userStore';

// 使用dynamic导入，并禁用SSR
const GameCanvas = dynamic(
  () => import('../components/game/GameCanvas'),
  { ssr: false }
);

// 同样使用dynamic导入聊天组件
const ChatBox = dynamic(
  () => import('../components/ui/Chat/ChatBox'),
  { ssr: false }
);

// 简单错误捕获组件
function SimpleErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // 为了捕获全局错误，设置一个全局错误处理器
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      event.preventDefault();
      setHasError(true);
      setErrorMessage(event.message || "未知错误");
    };
    
    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);
  
  if (hasError) {
    return (
      <div className="bg-red-200 p-4 rounded">
        <h2 className="text-xl text-red-800">游戏加载出错</h2>
        <p className="text-red-700">{errorMessage}</p>
        <button 
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
          onClick={() => {
            setHasError(false);
            setErrorMessage(null);
            window.location.reload();
          }}
        >
          尝试重新加载
        </button>
      </div>
    );
  }
  
  return <div>{children}</div>;
}

export default function Home() {
  const { userName, setUserName } = useUserStore();
  const { availableAvatars, selectedAvatar, setSelectedAvatar } = useAvatarStore();
  const { setSelectedScene } = useSceneStore();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showChat, setShowChat] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [gameError, setGameError] = useState<string | null>(null);
  const [showGameArea, setShowGameArea] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  const itemsPerPage = 8; // 每页显示数量
  
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
  
  // 默认选择海盗场景
  useEffect(() => {
    setSelectedScene('overworld');
  }, [setSelectedScene]);
  
  // 拦截控制台日志用于调试
  useEffect(() => {
    if (typeof window !== 'undefined' && showDebug) {
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;
      
      console.log = (...args: unknown[]) => {
        originalConsoleLog(...args);
        setDebugLog(prev => [...prev, `[LOG] ${String(args)}`].slice(-100));
      };
      
      console.error = (...args: unknown[]) => {
        originalConsoleError(...args);
        setDebugLog(prev => [...prev, `[ERROR] ${String(args)}`].slice(-100));
        setGameError(`错误: ${String(args)}`);
      };
      
      console.warn = (...args: unknown[]) => {
        originalConsoleWarn(...args);
        setDebugLog(prev => [...prev, `[WARN] ${String(args)}`].slice(-100));
      };
      
      return () => {
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
      };
    }
  }, [showDebug]);

  // 返回首页的处理函数
  const handleReturnToHome = () => {
    // 显示确认对话框
    setShowExitConfirm(true);
  };
  
  // 确认返回首页
  const confirmReturn = () => {
    // 关闭确认对话框并返回首页
    setShowExitConfirm(false);
    setShowGameArea(false);
    setGameError(null);
  };
  
  // 取消返回首页
  const cancelReturn = () => {
    setShowExitConfirm(false);
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden flex flex-col">
      {/* 固定顶部Header */}
      <header className="w-full bg-gray-900 text-white py-3 px-4 flex justify-between items-center z-30 border-b-2 border-[#634F7D] shadow-lg">
        <div className="text-2xl font-bold text-[#CC850A] flex items-center">
          <span className="mr-2">⚔️</span>
          Haiven NPC
        </div>
        <div className="flex gap-3">
          {showGameArea && (
            <button 
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors shadow-md text-sm border border-gray-600"
              onClick={handleReturnToHome}
            >
              返回首页
            </button>
          )}
          <button 
            className="px-4 py-2 bg-[#634F7D] text-white rounded-md hover:bg-[#735F8D] transition-colors shadow-md text-sm border border-[#735F8D]"
            onClick={() => setShowChat(!showChat)}
          >
            {showChat ? '隐藏聊天' : '显示聊天'}
          </button>
          <button 
            className={`px-4 py-2 ${showDebug ? 'bg-[#F2617A]' : 'bg-gray-700'} text-white rounded-md hover:bg-[#F2617A]/80 transition-colors shadow-md text-sm border ${showDebug ? 'border-[#F2617A]/70' : 'border-gray-600'}`}
            onClick={() => setShowDebug(!showDebug)}
          >
            {showDebug ? '隐藏调试' : '显示调试'}
          </button>
        </div>
      </header>
      
      {/* 主体内容区 */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* 背景 */}
        <div className="absolute inset-0 bg-gray-900 z-0" style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(31, 41, 55, 1) 0%, rgba(17, 24, 39, 1) 100%)'
        }}></div>
        
        {/* 游戏地图区域 - 放在底层 */}
        {showGameArea && (
          <div className="absolute inset-0 z-0">
            <div className="w-full h-full bg-gray-900">
              {gameError ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-80 z-50">
                  <div className="bg-gray-800 p-6 rounded-lg max-w-lg border-2 border-[#634F7D] shadow-xl">
                    <h3 className="text-xl font-bold text-[#634F7D] mb-2">游戏加载错误</h3>
                    <p className="text-gray-300 mb-4">{gameError}</p>
                    <div className="flex justify-end">
                      <button 
                        className="px-4 py-2 bg-[#634F7D] text-white rounded hover:bg-[#735F8D] shadow-md transition-colors" 
                        onClick={() => setGameError(null)}
                      >
                        重试
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
              
              {/* 简洁的操作指南提示 */}
              <div className="absolute top-3 left-1/2 transform -translate-x-1/2 bg-gray-900/90 px-4 py-1.5 rounded-full z-10 text-xs border border-[#634F7D]/50 shadow-md backdrop-blur-sm">
                <span className="hidden sm:inline text-white">方向键</span><span className="inline sm:hidden text-white">↑↓←→</span>: 移动 • 
                <span className="text-[#CC850A]">空格</span>: 互动 • 
                <span className="text-[#634F7D]">T/N</span>: 聊天
              </div>
              
              {/* 玩家信息小窗口 */}
              <div className="absolute top-3 left-3 bg-gray-900/80 p-2 rounded-lg z-10 border border-[#CC850A]/50 shadow-md flex items-center space-x-2">
                {selectedAvatar && (
                  <div className="w-8 h-8 bg-gray-800 rounded-full overflow-hidden flex-shrink-0 border border-[#CC850A]/80">
                    <img 
                      src={availableAvatars.find(a => a.id === selectedAvatar)?.image} 
                      alt="Avatar" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div className="text-white text-sm font-medium truncate max-w-[100px]">
                  {userName || "玩家"}
                </div>
              </div>
              
              {/* 场景信息 */}
              <div className="absolute bottom-3 right-3 bg-gray-900/80 px-3 py-1.5 rounded-lg z-10 border border-[#634F7D]/50 shadow-md">
                <div className="text-[#634F7D] text-xs font-medium flex items-center">
                  <span className="mr-1">🏝️</span>
                  海盗场景 (Overworld)
                </div>
              </div>
              
              <SimpleErrorBoundary>
                <GameCanvas className="w-full h-full" />
              </SimpleErrorBoundary>
            </div>
          </div>
        )}
        
        {/* 初始配置页面 - 只在游戏未开始时显示 */}
        {!showGameArea && (
          <div className="absolute inset-0 flex justify-center items-center z-10">
            <div className="w-full max-w-5xl px-4">
              {/* RPG风格的标题 */}
              <div className="text-center mb-8">
                <div className="h-1 w-40 bg-gradient-to-r from-[#634F7D] via-[#CC850A] to-[#634F7D] mx-auto"></div>
                <p className="text-gray-300 mt-4 text-lg">
                  创建你的数字分身，踏上与NPC对话的奇幻旅程
                </p>
              </div>
              
              {/* 内容卡片 */}
              <div className="bg-gray-800 bg-opacity-80 rounded-xl p-6 border border-gray-700 shadow-2xl">
                <div className="grid grid-cols-3 gap-8">
                  {/* 玩家信息栏 */}
                  <div className="col-span-1 space-y-6">
                    {/* 玩家名称 */}
                    <div className="bg-gray-900 bg-opacity-60 rounded-lg border border-gray-700 p-4 shadow-md overflow-hidden relative">
                      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-[#634F7D]/10"></div>
                      <div className="absolute -left-6 -bottom-6 w-24 h-24 rounded-full bg-[#634F7D]/10"></div>
                      <h2 className="text-[#CC850A] text-xl font-bold mb-3 flex items-center relative z-10">
                        <span className="mr-2">👤</span> 玩家信息
                      </h2>
                      <div className="space-y-3 relative z-10">
                        <div>
                          <label className="block text-gray-400 text-sm mb-1">角色名称</label>
                          <input
                            type="text"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            placeholder="输入你的名字"
                            className="w-full py-2.5 px-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:border-[#634F7D] focus:outline-none focus:ring-1 focus:ring-[#634F7D]"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* 场景选择 */}
                    <div className="bg-gray-900 bg-opacity-60 rounded-lg border border-gray-700 p-4 shadow-md overflow-hidden relative">
                      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-[#634F7D]/10"></div>
                      <div className="absolute -left-6 -bottom-6 w-24 h-24 rounded-full bg-[#634F7D]/10"></div>
                      <h2 className="text-[#CC850A] text-xl font-bold mb-3 flex items-center relative z-10">
                        <span className="mr-2">🌍</span> 场景选择
                      </h2>
                      <div className="bg-gray-800 p-3 rounded-lg cursor-pointer transition hover:bg-gray-700 border-2 border-[#634F7D]">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-white">海盗场景</h3>
                            <p className="text-sm text-gray-400 mt-1">海盗主题冒险场景</p>
                          </div>
                          <div className="flex-shrink-0 w-12 h-12 bg-[#CC850A]/20 rounded-full flex items-center justify-center border-2 border-[#634F7D]">
                            <span className="text-xl">🏝️</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 开始游戏按钮 */}
                    <div className="text-center mt-4">
                      <button 
                        className={`w-full py-3 px-6 rounded-md text-lg font-bold transition transform hover:scale-105 ${
                          userName.trim() && selectedAvatar
                            ? 'bg-gradient-to-r from-[#634F7D] to-[#483A5C] text-white shadow-lg hover:from-[#735F8D] hover:to-[#583A6C]' 
                            : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                        }`}
                        onClick={() => {
                          if (!userName.trim() || !selectedAvatar) return;
                          
                          if (!userName.trim()) {
                            setUserName('玩家');
                          }
                          
                          setShowGameArea(true);
                        }}
                        disabled={!userName.trim() || !selectedAvatar}
                      >
                        开始冒险
                      </button>
                    </div>
                  </div>
                  
                  {/* 角色选择区 */}
                  <div className="col-span-2 bg-gray-900 bg-opacity-60 rounded-lg border border-gray-700 p-4 shadow-md">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-[#CC850A] text-xl font-bold flex items-center">
                        <span className="mr-">🧙</span> 选择你的角色
                      </h2>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="搜索角色..."
                          className="py-1.5 px-3 pr-8 w-48 bg-gray-700 rounded-md text-white text-sm border border-gray-600 focus:border-[#634F7D] focus:outline-none"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <span className="absolute right-2.5 top-2 text-gray-400">🔍</span>
                      </div>
                    </div>
                    
                    {/* 角色网格 */}
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      {paginatedAvatars.map((avatar) => (
                        <div 
                          key={avatar.id}
                          className={`bg-gray-800 rounded-lg cursor-pointer transition transform hover:scale-105 ${
                            selectedAvatar === avatar.id 
                              ? 'ring-2 ring-[#634F7D] shadow-[0_0_8px_rgba(204,133,10,0.6)]' 
                              : 'border border-gray-700 hover:border-[#634F7D]'
                          }`}
                          onClick={() => setSelectedAvatar(avatar.id)}
                        >
                          <div className={`aspect-square bg-gray-900 rounded-t-lg p-1.5 flex items-center justify-center overflow-hidden relative ${selectedAvatar === avatar.id ? 'bg-[#CC850A]/10' : ''}`}>
                            {selectedAvatar === avatar.id && (
                              <div className="absolute inset-0 bg-gradient-to-b from-[#CC850A]/0 via-[#CC850A]/0 to-[#CC850A]/10"></div>
                            )}
                            <img 
                              src={avatar.image} 
                              alt={avatar.name} 
                              className="w-full h-full object-contain relative z-10"
                            />
                          </div>
                          <div className={`py-2 px-3 border-t border-gray-700 ${selectedAvatar === avatar.id ? 'bg-[#CC850A]/20' : ''}`}>
                            <h3 className="font-medium text-center text-gray-200">{avatar.name}</h3>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* 分页 */}
                    {totalPages > 1 && (
                      <div className="flex justify-center space-x-2">
                        <button 
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className={`px-3 py-1.5 rounded-md ${
                            currentPage === 1 
                              ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                              : 'bg-[#634F7D] text-white hover:bg-[#735F8D]'
                          }`}
                        >
                          上一页
                        </button>
                        
                        <div className="bg-gray-800 px-4 py-1.5 rounded-md flex items-center border border-gray-700">
                          <span className="text-gray-400">第</span>
                          <span className="text-white mx-1 font-bold">{currentPage}</span>
                          <span className="text-gray-400">页 / 共</span>
                          <span className="text-white mx-1 font-bold">{totalPages}</span>
                          <span className="text-gray-400">页</span>
                        </div>
                        
                        <button 
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className={`px-3 py-1.5 rounded-md ${
                            currentPage === totalPages 
                              ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                              : 'bg-[#634F7D] text-white hover:bg-[#735F8D]'
                          }`}
                        >
                          下一页
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* 底部提示 */}
              <div className="mt-6 text-center">
                <p className="text-gray-500 text-sm flex items-center justify-center gap-1">
                  <span className="text-white">↑↓←→</span>: 移动 • 
                  <span className="text-[#CC850A]">空格</span>: 互动 • 
                  <span className="text-[#634F7D]">T/N</span>: 聊天
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* 游戏中的侧边栏 */}
        {showGameArea && (
          <>
            {/* 去掉左侧配置区，让游戏占据更多空间 */}
            
            {/* 游戏区域占据主要空间 */}
            <div className="flex-1"></div>
            
            {/* 右侧聊天窗口 - 放在上层 */}
            {showChat && (
              <div className="w-96 bg-gray-900/90 p-4 border-l border-[#634F7D]/30 z-10 relative">
                <h2 className="text-[#CC850A] font-semibold mb-3 flex items-center text-lg">
                  <span className="mr-1.5">💬</span>聊天
                </h2>
                <div className="h-[calc(100%-3rem)]">
                  <ChatBox />
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* 调试面板 */}
      {showDebug && (
        <div className="absolute top-16 right-4 w-80 h-[70vh] bg-black/90 rounded-lg p-3 z-20 text-xs text-green-400 font-mono border border-gray-700">
          <h3 className="text-sm font-bold mb-2 text-[#CC850A] flex items-center">
            <span className="mr-1.5">🛠️</span>调试信息
          </h3>
          <div className="h-[calc(100%-4rem)] overflow-y-auto">
            {debugLog.map((log, i) => (
              <div key={i} className={`py-1 ${log.includes('[ERROR]') ? 'text-red-400' : log.includes('[WARN]') ? 'text-[#CC850A]' : 'text-green-400'}`}>
                {log}
              </div>
            ))}
          </div>
          <div className="mt-2 border-t border-gray-700 pt-2 flex">
            <button 
              className="px-2 py-1 bg-gray-700 text-white text-xs rounded mr-2 hover:bg-gray-600"
              onClick={() => setDebugLog([])}
            >
              清空日志
            </button>
            {showGameArea && (
              <button 
                className="px-2 py-1 bg-[#634F7D] text-white text-xs rounded hover:bg-[#735F8D]"
                onClick={() => window.location.reload()}
              >
                重新加载
              </button>
            )}
          </div>
        </div>
      )}

      {/* 退出确认对话框 */}
      {showExitConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md border-2 border-[#634F7D] shadow-xl">
            <h3 className="text-xl font-bold text-[#634F7D] mb-4">确认返回</h3>
            <p className="text-gray-300 mb-6">
              确定要返回首页吗？您可以修改角色或设置，但当前游戏进度不会被保存。
            </p>
            <div className="flex justify-end gap-3">
              <button 
                className="px-5 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                onClick={cancelReturn}
              >
                取消
              </button>
              <button 
                className="px-5 py-2 bg-[#634F7D] text-white rounded-md hover:bg-[#735F8D] transition-colors"
                onClick={confirmReturn}
              >
                确认返回
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
} 