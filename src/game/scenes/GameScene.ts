import * as Phaser from 'phaser';
import Player from '../objects/Player';

interface GameSceneData {
  wallsGroup?: Phaser.Physics.Arcade.StaticGroup;
  obstaclesGroup?: Phaser.Physics.Arcade.StaticGroup;
  map?: Phaser.Tilemaps.Tilemap;
  groundLayer?: Phaser.Tilemaps.TilemapLayer;
  obstaclesLayer?: Phaser.Tilemaps.TilemapLayer;
}

export default class GameScene extends Phaser.Scene implements GameSceneData {
  private player!: Player;
  private debugText!: Phaser.GameObjects.Text;
  public wallsGroup?: Phaser.Physics.Arcade.StaticGroup;
  public obstaclesGroup?: Phaser.Physics.Arcade.StaticGroup;
  public map?: Phaser.Tilemaps.Tilemap;
  public groundLayer?: Phaser.Tilemaps.TilemapLayer;
  public obstaclesLayer?: Phaser.Tilemaps.TilemapLayer;
  
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
      
      // 创建海盗主题地图
      this.createPirateMap();
      
      // 创建玩家
      console.log('GameScene: 创建玩家');
      const spawnPoint = this.map?.getObjectLayer('Objects')?.objects.find((obj: Phaser.Types.Tilemaps.TiledObject) => obj.name === 'Spawn Point');
      
      this.player = new Player(
        this,
        spawnPoint ? spawnPoint.x : 400,
        spawnPoint ? spawnPoint.y : 300,
        'jelly'
      );
      
      // 添加物理碰撞 - 使用更安全的方式
      this.setupCollisions();
      
      // 设置相机
      this.setupCamera();
      
      this.setDebugText('游戏场景初始化完成');
    } catch (error) {
      console.error('GameScene: 创建场景时发生错误:', error);
      this.setDebugText(`错误: ${error}`);
    }
  }

  private createPirateMap(): void {
    try {
      console.log('GameScene: 开始创建海盗主题地图');
      
      // 创建海盗主题地图
      this.map = this.make.tilemap({ key: 'pirate_map' });
      console.log('GameScene: 地图创建成功', this.map);
      
      if (!this.map) {
        throw new Error('地图创建失败');
      }
      
      // 添加图块集
      const tileset = this.map.addTilesetImage('pirate_tileset', 'pirate_tileset');
      console.log('GameScene: 图块集添加结果', tileset);
      
      if (!tileset) {
        throw new Error('无法加载海盗主题tileset');
      }
      
      // 创建图层
      this.groundLayer = this.map.createLayer('Ground', tileset, 0, 0);
      console.log('GameScene: 地面图层创建成功', this.groundLayer);
      
      this.obstaclesLayer = this.map.createLayer('Obstacles', tileset, 0, 0);
      console.log('GameScene: 障碍物图层创建成功', this.obstaclesLayer);
      
      // 设置碰撞 - 使用更安全的方式
      try {
        if (this.obstaclesLayer) {
          console.log('GameScene: 开始设置障碍物图层碰撞');
          
          // 检查图层是否为空
          const isEmpty = this.obstaclesLayer.tilemap.layers.find(
            (layer: Phaser.Tilemaps.LayerData) => layer.name === 'Obstacles'
          )?.data.every(
            (row: Phaser.Tilemaps.Tile[]) => row.every(
              (tile: Phaser.Tilemaps.Tile) => tile.index === -1
            )
          );
          
          if (isEmpty) {
            console.log('GameScene: 障碍物图层为空，跳过碰撞设置');
          } else {
            // 使用更简单的方式设置碰撞，避免使用 setCollisionBetween
            // 手动遍历图层并设置碰撞
            const width = this.obstaclesLayer.width;
            const height = this.obstaclesLayer.height;
            
            for (let y = 0; y < height; y++) {
              for (let x = 0; x < width; x++) {
                const tile = this.obstaclesLayer.getTileAt(x, y);
                if (tile && tile.index > 0) {
                  tile.setCollision(true);
                }
              }
            }
            
            console.log('GameScene: 障碍物图层碰撞设置完成');
          }
        }
      } catch (collisionError) {
        console.error('GameScene: 设置障碍物碰撞时发生错误:', collisionError);
      }
      
      // 设置边界碰撞 - 使用更安全的方式
      try {
        if (this.groundLayer) {
          console.log('GameScene: 开始设置地面图层碰撞');
          // 只为边界设置碰撞
          this.groundLayer.setCollisionBetween(1, 1); // 只有 ID 为 1 的图块有碰撞
          console.log('GameScene: 地面图层碰撞设置完成');
        }
      } catch (collisionError) {
        console.error('GameScene: 设置地面碰撞时发生错误:', collisionError);
      }
      
      // 设置世界边界
      try {
        if (this.map) {
          console.log('GameScene: 开始设置世界边界');
          const mapWidth = this.map.widthInPixels;
          const mapHeight = this.map.heightInPixels;
          console.log(`GameScene: 地图尺寸 ${mapWidth}x${mapHeight}`);
          this.physics.world.setBounds(0, 0, mapWidth, mapHeight);
          console.log('GameScene: 世界边界设置完成');
        }
      } catch (boundsError) {
        console.error('GameScene: 设置世界边界时发生错误:', boundsError);
      }
      
      console.log('GameScene: 海盗主题地图创建完成');
    } catch (error) {
      console.error('GameScene: 创建海盗主题地图时发生错误:', error);
      this.setDebugText(`地图错误: ${error}`);
      
      // 创建一个简单的备用地图
      this.createFallbackMap();
    }
  }
  
  // 创建一个简单的备用地图，当主地图加载失败时使用
  private createFallbackMap(): void {
    try {
      console.log('GameScene: 创建备用地图');
      
      // 创建一个简单的背景
      const width = this.cameras.main.width;
      const height = this.cameras.main.height;
      
      // 添加背景
      const background = this.add.rectangle(0, 0, width, height, 0x88cc88);
      background.setOrigin(0, 0);
      background.setDepth(0);
      
      // 创建物理组
      this.wallsGroup = this.physics.add.staticGroup();
      
      if (!this.wallsGroup) {
        console.error('GameScene: 无法创建墙壁物理组');
        return;
      }
      
      // 创建边界墙
      const wallThickness = 20;
      
      // 上边界
      const topWall = this.add.rectangle(0, 0, width, wallThickness, 0x663300);
      topWall.setOrigin(0, 0);
      topWall.setDepth(1);
      this.wallsGroup.add(topWall);
      
      // 下边界
      const bottomWall = this.add.rectangle(0, height - wallThickness, width, wallThickness, 0x663300);
      bottomWall.setOrigin(0, 0);
      bottomWall.setDepth(1);
      this.wallsGroup.add(bottomWall);
      
      // 左边界
      const leftWall = this.add.rectangle(0, 0, wallThickness, height, 0x663300);
      leftWall.setOrigin(0, 0);
      leftWall.setDepth(1);
      this.wallsGroup.add(leftWall);
      
      // 右边界
      const rightWall = this.add.rectangle(width - wallThickness, 0, wallThickness, height, 0x663300);
      rightWall.setOrigin(0, 0);
      rightWall.setDepth(1);
      this.wallsGroup.add(rightWall);
      
      // 设置世界边界
      this.physics.world.setBounds(0, 0, width, height);
      
      console.log('GameScene: 备用地图创建完成');
    } catch (error) {
      console.error('GameScene: 创建备用地图时发生错误:', error);
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

  // 设置碰撞
  private setupCollisions(): void {
    try {
      // 与地图图层的碰撞
      if (this.groundLayer) {
        console.log('GameScene: 添加玩家与地面图层的碰撞');
        this.physics.add.collider(this.player, this.groundLayer);
      }
      
      if (this.obstaclesLayer) {
        console.log('GameScene: 添加玩家与障碍物图层的碰撞');
        this.physics.add.collider(this.player, this.obstaclesLayer);
      }
      
      // 与备用地图墙壁的碰撞
      if (this.wallsGroup) {
        console.log('GameScene: 添加玩家与墙壁的碰撞');
        this.physics.add.collider(this.player, this.wallsGroup);
      }
      
      if (this.obstaclesGroup) {
        console.log('GameScene: 添加玩家与障碍物的碰撞');
        this.physics.add.collider(this.player, this.obstaclesGroup);
      }
    } catch (collisionError) {
      console.error('GameScene: 设置碰撞时发生错误:', collisionError);
    }
  }
  
  // 设置相机
  private setupCamera(): void {
    try {
      if (this.map) {
        const mapWidth = this.map.widthInPixels;
        const mapHeight = this.map.heightInPixels;
        this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
        this.cameras.main.setScroll(mapWidth / 2 - 400, mapHeight / 2 - 300);
      } else {
        // 如果使用备用地图，则设置相机到屏幕中心
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        this.cameras.main.setBounds(0, 0, width, height);
        this.cameras.main.setScroll(0, 0);
      }
    } catch (cameraError) {
      console.error('GameScene: 设置相机时发生错误:', cameraError);
    }
  }
} 