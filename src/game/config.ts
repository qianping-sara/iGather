// 使用typeof window !== 'undefined'检查是否在浏览器环境中
const isDevelopment = typeof window !== 'undefined' && 
  window.location.hostname === 'localhost';

// 导出一个配置对象，但不导入Phaser，避免服务器端渲染问题
export const gameConfig = {
  type: 'AUTO',  // Phaser.AUTO的字符串表示
  width: 960,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#333333',
  pixelArt: true, // 启用像素艺术模式
  scale: {
    mode: 'RESIZE',
    autoCenter: 'CENTER_BOTH',
    width: 960,
    height: 600,
    min: {
      width: 400,
      height: 300
    },
    max: {
      width: 1600,
      height: 1200
    }
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: isDevelopment
    }
  },
  render: {
    antialias: false,
    pixelArt: true,
    roundPixels: true
  },
  scene: [] // 场景将在客户端动态添加
};

export default gameConfig; 