import * as Phaser from 'phaser';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private moveSpeed: number = 200;
  private debugText: Phaser.GameObjects.Text;
  private lastDirection: string = 'down';
  private playerCircle: Phaser.GameObjects.Arc;
  
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    
    // 添加到场景
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // 设置物理属性
    this.setCollideWorldBounds(true);
    this.setSize(24, 24);
    this.setDisplaySize(24, 24);
    
    // 创建一个更明显的玩家图形
    this.playerCircle = scene.add.circle(x, y, 12, 0x0000ff);
    this.playerCircle.setDepth(10);
    
    // 获取键盘控制
    this.cursors = scene.input.keyboard.createCursorKeys();
    
    // 设置显示属性
    this.setDepth(10);
    this.setVisible(false); // 隐藏默认精灵
    
    // 添加调试文本
    this.debugText = scene.add.text(x, y - 25, '玩家', {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#000000'
    });
    this.debugText.setDepth(11);
    this.debugText.setOrigin(0.5, 0.5);
    
    console.log(`Player: 创建在位置 (${x}, ${y}), 使用纹理 ${texture}`);
  }
  
  update(): void {
    try {
      // 处理移动输入
      const velocity = new Phaser.Math.Vector2(0, 0);
      
      if (this.cursors.left.isDown) {
        velocity.x = -this.moveSpeed;
        this.lastDirection = 'left';
      } else if (this.cursors.right.isDown) {
        velocity.x = this.moveSpeed;
        this.lastDirection = 'right';
      }
      
      if (this.cursors.up.isDown) {
        velocity.y = -this.moveSpeed;
        this.lastDirection = 'up';
      } else if (this.cursors.down.isDown) {
        velocity.y = this.moveSpeed;
        this.lastDirection = 'down';
      }
      
      // 应用速度
      this.setVelocity(velocity.x, velocity.y);
      
      // 更新圆形位置
      this.playerCircle.setPosition(this.x, this.y);
      
      // 更新调试文本位置
      this.debugText.setPosition(this.x, this.y - 25);
    } catch (error) {
      console.error('Player: 更新时发生错误:', error);
    }
  }
  
  // 销毁时清理
  destroy(fromScene?: boolean): void {
    try {
      if (this.debugText) {
        this.debugText.destroy();
      }
      if (this.playerCircle) {
        this.playerCircle.destroy();
      }
      super.destroy(fromScene);
    } catch (error) {
      console.error('Player: 销毁时发生错误:', error);
    }
  }
} 