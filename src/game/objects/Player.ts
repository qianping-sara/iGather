import * as Phaser from 'phaser';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private moveSpeed: number = 200;
  private debugText: Phaser.GameObjects.Text;
  private lastDirection: string = 'down';
  
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    
    // 添加到场景
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // 设置物理属性
    this.setCollideWorldBounds(true);
    
    // 获取键盘控制
    this.cursors = scene.input.keyboard.createCursorKeys();
    
    // 设置显示属性
    this.setDepth(10);
    this.setScale(1);
    
    // 添加调试文本
    this.debugText = scene.add.text(x, y - 20, texture, {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#000000'
    });
    this.debugText.setDepth(11);
    
    console.log(`Player: 创建在位置 (${x}, ${y}), 使用纹理 ${texture}`);
  }
  
  update(): void {
    // 处理移动输入
    const velocity = new Phaser.Math.Vector2(0, 0);
    
    if (this.cursors.left.isDown) {
      velocity.x = -this.moveSpeed;
      this.lastDirection = 'left';
      this.setFlipX(true);
    } else if (this.cursors.right.isDown) {
      velocity.x = this.moveSpeed;
      this.lastDirection = 'right';
      this.setFlipX(false);
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
    
    // 更新调试文本位置
    this.debugText.setPosition(this.x - this.debugText.width / 2, this.y - 20);
    this.debugText.setText(`${this.texture.key} (${this.lastDirection})`);
  }
  
  // 销毁时清理
  destroy(fromScene?: boolean): void {
    this.debugText.destroy();
    super.destroy(fromScene);
  }
} 