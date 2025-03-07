import Phaser from 'phaser';
import { useSceneStore } from '../../store/sceneStore';
import { useAvatarStore } from '../../store/avatarStore';

export default class PreloadScene extends Phaser.Scene {
  private debugText?: Phaser.GameObjects.Text;
  private filesLoaded: { [key: string]: boolean } = {};
  
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    try {
      console.log('PreloadScene: 开始加载资源');
      
      // 创建调试文本
      this.debugText = this.add.text(10, 10, '加载资源中...', {
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: '#000000'
      });
      
      // 安全设置文本深度
      if (this.debugText) {
        this.debugText.setDepth(1000);
      }
      
      this.handleErrors();
      this.createProgressBar();

      // 直接创建默认纹理
      console.log('PreloadScene: 创建默认纹理');
      this.createDefaultTextures();
    } catch (e) {
      console.error('PreloadScene: 加载资源时发生错误:', e);
      this.setDebugText(`错误：${e}`);
    }
  }

  create() {
    console.log('PreloadScene: 进入create阶段');
    
    try {
      // 获取当前选择的场景和角色
      const sceneStore = useSceneStore.getState();
      const avatarStore = useAvatarStore.getState();
      
      const selectedScene = sceneStore.selectedScene;
      const selectedAvatar = avatarStore.selectedAvatar;
      
      console.log(`PreloadScene: 准备启动游戏 - 角色: ${selectedAvatar}, 场景: ${selectedScene}`);
      
      // 检查资源是否都加载成功
      this.checkAllAssets();
      
      // 启动游戏场景
      console.log('PreloadScene: 启动GameScene');
      this.scene.start('GameScene', { 
        avatarKey: selectedAvatar || 'jelly',
        sceneKey: selectedScene || 'town'
      });
    } catch (e) {
      console.error('PreloadScene: create阶段发生错误:', e);
      this.setDebugText(`错误：${e}`);
    }
  }

  // 错误处理
  private handleErrors() {
    this.load.on('loaderror', (fileObj: Phaser.Loader.File) => {
      console.error('PreloadScene: 文件加载错误:', fileObj.key);
      this.setDebugText(`错误：${fileObj.key} 加载失败`);
      this.filesLoaded[fileObj.key] = false;
    });
  }

  // 创建所有默认纹理
  private createDefaultTextures(): void {
    const textures = ['jelly', 'npc'];
    const colors = {
      jelly: 0x00ff00,  // 绿色
      npc: 0xff0000     // 红色
    };

    textures.forEach(key => {
      try {
        // 创建一个32x32的彩色方块
        const graphics = this.add.graphics();
        graphics.fillStyle(colors[key as keyof typeof colors]);
        graphics.fillRect(0, 0, 32, 32);
        graphics.lineStyle(2, 0x000000);
        graphics.strokeRect(0, 0, 32, 32);
        
        // 将图形转换为纹理
        graphics.generateTexture(key, 32, 32);
        graphics.destroy();
        
        this.filesLoaded[key] = true;
        console.log(`PreloadScene: 创建默认纹理 - ${key}`);
      } catch (error) {
        console.error(`PreloadScene: 创建默认纹理失败 - ${key}:`, error);
        this.filesLoaded[key] = false;
      }
    });

    // 触发完成事件
    this.load.emit('complete');
  }

  // 进度条创建
  private createProgressBar() {
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(240, 270, 320, 50);
    
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: '加载中...',
      style: {
        font: '20px monospace',
        color: '#ffffff'
      }
    });
    loadingText.setOrigin(0.5, 0.5);
    
    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(250, 280, 300 * value, 30);
      this.setDebugText(`加载进度: ${Math.floor(value * 100)}%`);
    });
    
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });
  }
  
  // 检查所有资源
  private checkAllAssets() {
    console.log('PreloadScene: 检查资源状态');
    const textures = this.textures.getTextureKeys();
    console.log('PreloadScene: 已加载的纹理:', textures);
    
    // 检查关键资源
    const criticalResources = ['jelly', 'npc'];
    criticalResources.forEach(key => {
      if (this.filesLoaded[key]) {
        console.log(`PreloadScene: ${key} 已成功加载`);
      } else {
        console.warn(`PreloadScene: ${key} 未加载或加载失败`);
      }
    });
  }
  
  // 安全设置调试文本
  private setDebugText(text: string): void {
    if (this.debugText) {
      this.debugText.setText(text);
    }
    console.log(`[PreloadScene] ${text}`);
  }
} 