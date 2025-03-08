import * as Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    console.log('BootScene: 开始加载基础资源');
  }

  create(): void {
    console.log('BootScene: 初始化完成，启动PreloadScene');
    
    // 设置游戏的基本配置
    this.scale.setGameSize(960, 600);
    this.scale.pageAlignHorizontally = true;
    this.scale.pageAlignVertically = true;
    
    // 启用物理系统
    this.physics.world.setBounds(0, 0, 960, 600);
    
    // 启动PreloadScene
    this.scene.start('PreloadScene');
  }
} 