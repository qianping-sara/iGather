import * as Phaser from 'phaser';
import Player from '../objects/Player';
import { createSimpleTilemap } from './create-demo-map';

interface GameSceneData {
  wallsGroup?: Phaser.Physics.Arcade.StaticGroup;
  obstaclesGroup?: Phaser.Physics.Arcade.StaticGroup;
}

export default class GameScene extends Phaser.Scene implements GameSceneData {
  private player!: Player;
  private debugText!: Phaser.GameObjects.Text;
  public wallsGroup?: Phaser.Physics.Arcade.StaticGroup;
  public obstaclesGroup?: Phaser.Physics.Arcade.StaticGroup;
  
  constructor() {
    super('GameScene');
  }

  create(): void {
    try {
      console.log('GameScene: 开始创建场景');
      
      // 添加调试文本
      this.debugText = this.add.text(10, 10, '初始化游戏场景...', {
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: '#000000'
      });
      this.debugText.setDepth(1000);
      
      // 创建简单的演示地图
      console.log('GameScene: 创建简单演示地图');
      createSimpleTilemap(this);
      
      // 创建玩家
      console.log('GameScene: 创建玩家');
      this.player = new Player(this, 400, 300, 'jelly');
      
      // 添加物理碰撞
      if (this.wallsGroup) {
        this.physics.add.collider(this.player, this.wallsGroup);
      }
      if (this.obstaclesGroup) {
        this.physics.add.collider(this.player, this.obstaclesGroup);
      }
      
      // 设置相机跟随
      this.cameras.main.startFollow(this.player);
      
      this.setDebugText('游戏场景初始化完成');
    } catch (error) {
      console.error('GameScene: 创建场景时发生错误:', error);
      this.setDebugText(`错误: ${error}`);
    }
  }

  update(): void {
    if (this.player) {
      this.player.update();
    }
  }

  private setDebugText(text: string): void {
    this.debugText.setText(text);
    console.log(`[GameScene] ${text}`);
  }
} 