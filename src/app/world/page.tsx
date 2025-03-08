'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAvatarStore } from '../../store/avatarStore';

// 使用dynamic导入，并禁用SSR
const GameCanvas = dynamic(
  () => import('../../components/game/GameCanvas'),
  { ssr: false }
);

// 同样使用dynamic导入聊天组件
const ChatBox = dynamic(
  () => import('../../components/ui/Chat/ChatBox'),
  { ssr: false }
);

// 简单错误捕获组件（使用hooks代替类组件）
function SimpleErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // 为了捕获全局错误，设置一个全局错误处理器
  useEffect(() => {
    // 设置全局错误处理器
    const handleError = (event: ErrorEvent) => {
      event.preventDefault();
      setHasError(true);
      setErrorMessage(event.message || "未知错误");
    };
    
    // 添加全局错误处理
    window.addEventListener('error', handleError);
    
    // 清理函数
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);
  
  // 无法在函数组件中捕获渲染错误，这只是一个简单的UI包装
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
            window.location.reload(); // 刷新页面重新加载
          }}
        >
          尝试重新加载
        </button>
      </div>
    );
  }
  
  return <div>{children}</div>;
}

export default function World(): React.ReactNode {
  const { selectedAvatar } = useAvatarStore();
  const [showChat, setShowChat] = useState(true);
  const [showDebug, setShowDebug] = useState(false); // 默认隐藏调试面板
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [gameError, setGameError] = useState<string | null>(null);
  
  // 更新当前场景名称显示
  const sceneName = '小镇场景';
  
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
  
  return (
    <main className="relative h-screen w-screen overflow-hidden">
      {/* 游戏画布 */}
      <div className="absolute inset-0 bg-gray-900">
        {gameError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-80 z-50">
            <div className="bg-red-100 p-6 rounded-lg max-w-lg">
              <h3 className="text-xl font-bold text-red-800 mb-2">游戏加载错误</h3>
              <p className="text-red-700 mb-4">{gameError}</p>
              <div className="flex justify-end">
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" 
                  onClick={() => setGameError(null)}
                >
                  重试
                </button>
              </div>
            </div>
          </div>
        ) : null}
        
        <SimpleErrorBoundary>
          <GameCanvas className="absolute inset-0" />
        </SimpleErrorBoundary>
      </div>
      
      {/* 顶部导航 */}
      <div className="absolute top-0 left-0 w-full p-4 bg-black/50 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-white hover:text-blue-300 transition">
            返回首页
          </Link>
          <span className="text-white/70">|</span>
          <span className="text-white font-semibold">{sceneName}</span>
          {selectedAvatar && (
            <>
              <span className="text-white/70">|</span>
              <span className="text-white/80">角色: {selectedAvatar}</span>
            </>
          )}
        </div>
        
        <div className="flex gap-4">
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            onClick={() => setShowChat(!showChat)}
          >
            {showChat ? '隐藏聊天' : '显示聊天'}
          </button>
          <Link 
            href="/customize" 
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
          >
            更换角色
          </Link>
          <button 
            className={`px-4 py-2 ${showDebug ? 'bg-yellow-600' : 'bg-gray-600'} text-white rounded hover:bg-yellow-700 transition`}
            onClick={() => setShowDebug(!showDebug)}
          >
            {showDebug ? '隐藏调试' : '显示调试'}
          </button>
        </div>
      </div>
      
      {/* 调试面板 */}
      {showDebug && (
        <div className="absolute top-20 right-6 w-96 h-[70vh] bg-black/80 rounded-lg p-3 z-20 text-xs text-green-400 font-mono">
          <h3 className="text-sm font-bold mb-2">调试信息</h3>
          <div className="h-[calc(100%-4rem)] overflow-y-auto">
            {debugLog.map((log, i) => (
              <div key={i} className={`py-1 ${log.includes('[ERROR]') ? 'text-red-400' : log.includes('[WARN]') ? 'text-yellow-400' : ''}`}>
                {log}
              </div>
            ))}
          </div>
          <div className="mt-2 border-t border-gray-700 pt-2">
            <button 
              className="px-2 py-1 bg-red-700 text-white text-xs rounded mr-2"
              onClick={() => setDebugLog([])}
            >
              清空日志
            </button>
            <button 
              className="px-2 py-1 bg-blue-700 text-white text-xs rounded"
              onClick={() => window.location.reload()}
            >
              重新加载页面
            </button>
          </div>
        </div>
      )}
      
      {/* 聊天框 */}
      {showChat && (
        <div className="absolute bottom-6 right-6 w-80 bg-black/70 rounded-lg p-3 z-10">
          <ChatBox />
        </div>
      )}
      
      {/* 操作指南 */}
      <div className="absolute bottom-6 left-6 bg-black/70 p-3 rounded-lg z-10">
        <h3 className="font-semibold text-white mb-2">操作指南</h3>
        <ul className="text-white/80 text-sm space-y-1">
          <li>方向键：移动角色</li>
          <li>空格键：互动（靠近NPC时）</li>
          <li>T键：快速打开/关闭聊天</li>
        </ul>
      </div>
    </main>
  );
} 