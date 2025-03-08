import * as Phaser from 'phaser';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private moveSpeed: number = 200;
  private debugText: Phaser.GameObjects.Text;
  private lastDirection: string = 'down';
  private playerCircle: Phaser.GameObjects.Arc;
  private playerAvatar: Phaser.GameObjects.Sprite | null = null;
  private userName: string;
  
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, userName: string = '玩家') {
    super(scene, x, y, texture);
    
    // 保存用户名称
    this.userName = userName;
    
    // 添加到场景
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // 设置物理属性 - 进一步减小碰撞体积
    this.setCollideWorldBounds(true);
    this.setSize(12, 12); // 进一步减小碰撞体积
    this.setOffset(2, 2); // 设置碰撞体积的偏移，使其更准确地位于玩家中心
    this.setDisplaySize(12, 12);
    
    // 创建玩家头像
    try {
      // 尝试使用提供的纹理创建头像精灵
      this.playerAvatar = scene.add.sprite(x, y, texture);
      if (this.playerAvatar) {
        this.playerAvatar.setDepth(10);
        this.playerAvatar.setDisplaySize(20, 20); // 进一步减小头像大小
      }
      
      // 如果纹理加载成功，不需要创建圆形
      this.playerCircle = scene.add.circle(x, y, 6, 0x0000ff); // 进一步减小圆形大小
      this.playerCircle.setDepth(9); // 放在头像后面作为背景
      this.playerCircle.setVisible(false); // 默认隐藏
      
      console.log(`Player: 成功创建头像精灵，使用纹理 ${texture}`);
    } catch (error) {
      // 如果纹理加载失败，创建一个蓝色圆形作为备用
      console.error(`Player: 创建头像精灵失败，使用备用圆形: ${error}`);
      this.playerCircle = scene.add.circle(x, y, 6, 0x0000ff); // 进一步减小圆形大小
      this.playerCircle.setDepth(10);
      this.playerCircle.setVisible(true);
    }
    
    // 获取键盘控制
    this.cursors = scene.input.keyboard.createCursorKeys();
    
    // 设置显示属性
    this.setDepth(10);
    this.setVisible(false); // 隐藏默认精灵
    
    // 添加调试文本 - 显示用户名，减小字体大小
    this.debugText = scene.add.text(x, y - 16, this.userName, {
      fontSize: '10px', // 进一步减小字体大小
      color: '#ffffff',
      backgroundColor: '#000000'
    });
    this.debugText.setDepth(11);
    this.debugText.setOrigin(0.5, 0.5);
    
    console.log(`Player: 创建在位置 (${x}, ${y}), 使用纹理 ${texture}, 用户名: ${this.userName}`);
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
      if (this.playerCircle) {
        this.playerCircle.setPosition(this.x, this.y);
      }
      
      // 更新头像位置
      if (this.playerAvatar) {
        this.playerAvatar.setPosition(this.x, this.y);
      }
      
      // 更新调试文本位置
      this.debugText.setPosition(this.x, this.y - 16); // 调整文本位置
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
      if (this.playerAvatar) {
        this.playerAvatar.destroy();
      }
      super.destroy(fromScene);
    } catch (error) {
      console.error('Player: 销毁时发生错误:', error);
    }
  }
} 