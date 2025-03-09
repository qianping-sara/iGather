'use client';

import { useEffect, useRef } from 'react';
import { useAvatarStore } from '../../store/avatarStore';
import { useSceneStore } from '../../store/sceneStore';
import { gameConfig } from '../../game/config';
import type * as PhaserType from 'phaser';

interface GameCanvasProps {
  className?: string;
}

const GameCanvas = ({ className }: GameCanvasProps) => {
  const gameRef = useRef<PhaserType.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { selectedAvatar } = useAvatarStore();
  const { selectedScene } = useSceneStore();

  useEffect(() => {
    const initGame = async () => {
      if (typeof window === 'undefined' || !containerRef.current) return;

      try {
        // 动态导入Phaser和场景
        const Phaser = await import('phaser');
        const { default: BootScene } = await import('../../game/scenes/BootScene');
        const { default: PreloadScene } = await import('../../game/scenes/PreloadScene');
        const { default: GameScene } = await import('../../game/scenes/GameScene');

        // 如果游戏已经存在，先销毁它
        if (gameRef.current) {
          gameRef.current.destroy(true);
          gameRef.current = null;
        }

        // 创建新的游戏实例
        const config = {
          ...gameConfig,
          type: Phaser.AUTO,
          parent: containerRef.current,
          scene: [BootScene, PreloadScene, GameScene],
          physics: {
            default: 'arcade',
            arcade: {
              gravity: { y: 0 },
              debug: process.env.NODE_ENV === 'development'
            }
          },
          scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: '100%',
            height: '100%',
          }
        };

        console.log('初始化游戏配置:', config);
        gameRef.current = new Phaser.Game(config);

        // 监听游戏场景就绪
        const waitForScenes = () => {
          if (gameRef.current?.scene.isActive('GameScene')) {
            // 发送初始数据到游戏场景
            const gameScene = gameRef.current.scene.getScene('GameScene');
            gameScene.events.emit('react-data', {
              avatarKey: selectedAvatar,
              sceneKey: selectedScene
            });
          } else {
            setTimeout(waitForScenes, 100);
          }
        };

        waitForScenes();
      } catch (error) {
        console.error('游戏初始化失败:', error);
      }
    };

    initGame();

    // 监听窗口大小变化
    const handleResize = () => {
      if (gameRef.current && gameRef.current.scale) {
        gameRef.current.scale.refresh();
      }
    };

    window.addEventListener('resize', handleResize);

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [selectedAvatar, selectedScene]);

  return (
    <div 
      ref={containerRef} 
      className={`game-canvas ${className || ''}`}
      style={{ 
        width: '100%', 
        height: '100%',
        backgroundColor: '#333333',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
      }}
    />
  );
};

export default GameCanvas; 