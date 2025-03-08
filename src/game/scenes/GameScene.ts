import * as Phaser from 'phaser';
import Player from '../objects/Player';
import { useUserStore } from '../../store/userStore';
import { useAvatarStore } from '../../store/avatarStore';

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
      
      // 获取用户名称和头像
      const userName = useUserStore.getState().userName || '玩家';
      const selectedAvatar = useAvatarStore.getState().selectedAvatar || 'default';
      console.log(`GameScene: 用户名称: ${userName}, 头像: ${selectedAvatar}`);
      
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
      
      // 尝试从对象层获取出生点，如果不存在则使用默认位置
      let spawnPoint = null;
      try {
        spawnPoint = this.map?.getObjectLayer('Objects')?.objects.find(
          (obj: Phaser.Types.Tilemaps.TiledObject) => obj.name === 'Spawn Point'
        );
      } catch (e) {
        console.log('GameScene: 无法找到对象层或出生点:', e);
      }
      
      // 计算玩家的初始位置，考虑地图偏移
      let playerX = spawnPoint ? spawnPoint.x : this.cameras.main.width / 2;
      let playerY = spawnPoint ? spawnPoint.y : this.cameras.main.height / 2;
      
      // 如果地图有偏移，则将偏移应用到玩家位置
      if (this.groundLayer) {
        // 获取地图位置
        const layerX = this.groundLayer.x;
        const layerY = this.groundLayer.y;
        
        if (spawnPoint) {
          // 如果有出生点，使用出生点位置
          playerX = layerX + spawnPoint.x;
          playerY = layerY + spawnPoint.y;
          console.log(`GameScene: 玩家初始位置设置为出生点 (${playerX}, ${playerY})`);
        } else {
          // 如果没有出生点，将玩家放在地图中心
          const mapWidth = this.map?.widthInPixels || 0;
          const mapHeight = this.map?.heightInPixels || 0;
          playerX = layerX + mapWidth / 2;
          playerY = layerY + mapHeight / 2;
          console.log(`GameScene: 玩家初始位置设置为地图中心 (${playerX}, ${playerY})`);
        }
      } else {
        console.log(`GameScene: 玩家初始位置设置为 (${playerX}, ${playerY})，无地图偏移`);
      }
      
      // 创建玩家实例
      this.player = new Player(
        this,
        playerX,
        playerY,
        selectedAvatar,
        userName
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
      const tileset = this.map.addTilesetImage('tilemap_packed', 'tilemap_packed');
      console.log('GameScene: 图块集添加结果', tileset);
      
      if (!tileset) {
        throw new Error('无法加载海盗主题tileset');
      }
      
      // 创建图层
      // 计算图层的偏移量，使地图居中
      const gameWidth = this.cameras.main.width;
      const gameHeight = this.cameras.main.height;
      const mapWidth = this.map.widthInPixels;
      const mapHeight = this.map.heightInPixels;
      
      console.log(`GameScene: 游戏视口尺寸 ${gameWidth}x${gameHeight}, 地图尺寸 ${mapWidth}x${mapHeight}`);
      
      // 计算偏移量，确保地图居中
      // 使用Math.round而不是Math.floor，以避免舍入误差
      const offsetX = Math.round((gameWidth - mapWidth) / 2);
      const offsetY = Math.round((gameHeight - mapHeight) / 2);
      
      console.log(`GameScene: 计算 - 游戏视口: ${gameWidth}x${gameHeight}, 地图: ${mapWidth}x${mapHeight}`);
      console.log(`GameScene: 应用地图偏移 X:${offsetX}, Y:${offsetY}`);
      
      // 创建图层 - 直接在创建时设置正确的位置
      this.groundLayer = this.map.createLayer('Terrain', tileset, offsetX, offsetY);
      this.obstaclesLayer = this.map.createLayer('Objects A', tileset, offsetX, offsetY);
      
      // 添加其他图层（如果存在）
      try {
        const objectsBLayer = this.map.createLayer('Objects B', tileset, offsetX, offsetY);
        const objectsCLayer = this.map.createLayer('Objects C', tileset, offsetX, offsetY);
        
        if (objectsBLayer) console.log('GameScene: Objects B图层创建成功');
        if (objectsCLayer) console.log('GameScene: Objects C图层创建成功');
      } catch (e) {
        console.log('GameScene: 创建额外图层时出错，可能不存在:', e);
      }
      
      console.log('GameScene: 图层创建成功，将使用相机缩放');
      
      // 不在这里设置图层缩放，而是在setupCamera中设置相机缩放
      
      // 设置碰撞 - 使用更安全的方式
      try {
        if (this.obstaclesLayer) {
          console.log('GameScene: 开始设置障碍物图层碰撞');
          
          // 检查图层是否为空
          const isEmpty = this.obstaclesLayer.tilemap.layers.find(
            (layer: Phaser.Tilemaps.LayerData) => layer.name === 'Objects A'
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
        if (this.map && this.groundLayer) {
          console.log('GameScene: 开始设置世界边界');
          
          // 获取地图尺寸和位置
          const mapWidth = this.map.widthInPixels;
          const mapHeight = this.map.heightInPixels;
          const layerX = this.groundLayer.x;
          const layerY = this.groundLayer.y;
          
          // 设置物理世界边界为地图的实际位置和尺寸
          this.physics.world.setBounds(layerX, layerY, mapWidth, mapHeight);
          
          // 确保物理世界边界设置正确
          const bounds = this.physics.world.bounds;
          console.log(`GameScene: 世界边界设置为 x:${bounds.x}, y:${bounds.y}, width:${bounds.width}, height:${bounds.height}`);
        } else if (this.map) {
          const mapWidth = this.map.widthInPixels;
          const mapHeight = this.map.heightInPixels;
          this.physics.world.setBounds(0, 0, mapWidth, mapHeight);
          console.log(`GameScene: 世界边界设置为默认值 0,0,${mapWidth},${mapHeight}`);
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
      console.log('GameScene: 开始设置碰撞');
      
      // 与地图图层的碰撞
      if (this.obstaclesLayer && this.player) {
        console.log('GameScene: 添加玩家与障碍物图层的碰撞');
        
        // 使用自定义碰撞处理，考虑玩家的边缘
        this.physics.add.collider(
          this.player, 
          this.obstaclesLayer,
          undefined,
          (player: Phaser.Types.Physics.Arcade.GameObjectWithBody, tile: Phaser.Types.Physics.Arcade.GameObjectWithBody) => {
            // 获取玩家的边界
            const playerBounds = player.getBounds();
            
            // 获取瓦片的边界
            const tileBounds = new Phaser.Geom.Rectangle(
              tile.x, 
              tile.y, 
              tile.width, 
              tile.height
            );
            
            // 检查是否有重叠
            const overlap = Phaser.Geom.Rectangle.Overlaps(playerBounds, tileBounds);
            
            // 如果有重叠，则返回true表示发生碰撞
            return overlap;
          },
          this
        );
        
        // 设置碰撞回调，用于调试
        this.physics.world.on('collide', (gameObject1: Phaser.GameObjects.GameObject, gameObject2: Phaser.GameObjects.GameObject) => {
          if (gameObject1 === this.player || gameObject2 === this.player) {
            // 玩家碰撞事件
            console.log('GameScene: 玩家发生碰撞');
          }
        });
      }
      
      // 与地面图层的碰撞
      if (this.groundLayer && this.player) {
        console.log('GameScene: 添加玩家与地面图层的碰撞');
        // 只与边界碰撞
        this.physics.add.collider(this.player, this.groundLayer);
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
      if (this.map && this.groundLayer) {
        // 设置缩放因子 - 降低一点以确保地图完整显示
        const scaleFactor = 3.0;
        
        // 获取地图尺寸和位置
        const mapWidth = this.map.widthInPixels;
        const mapHeight = this.map.heightInPixels;
        const layerX = this.groundLayer.x;
        const layerY = this.groundLayer.y;
        
        // 计算游戏视口尺寸
        const gameWidth = this.cameras.main.width;
        const gameHeight = this.cameras.main.height;
        
        // 计算缩放后的地图尺寸
        const scaledMapWidth = mapWidth * scaleFactor;
        const scaledMapHeight = mapHeight * scaleFactor;
        
        // 检查地图是否超出视口
        if (scaledMapWidth > gameWidth || scaledMapHeight > gameHeight) {
          // 如果超出，调整缩放因子以适应视口
          const widthRatio = gameWidth / mapWidth;
          const heightRatio = gameHeight / mapHeight;
          const adjustedScaleFactor = Math.min(widthRatio, heightRatio) * 0.9; // 留出10%的边距
          
          console.log(`GameScene: 地图太大，调整缩放因子从 ${scaleFactor} 到 ${adjustedScaleFactor}`);
          
          // 使用调整后的缩放因子
          this.cameras.main.setZoom(adjustedScaleFactor);
          
          // 重新计算缩放后的尺寸
          const newScaledMapWidth = mapWidth * adjustedScaleFactor;
          const newScaledMapHeight = mapHeight * adjustedScaleFactor;
          
          // 计算新的偏移量，确保地图居中
          const newOffsetX = (gameWidth - newScaledMapWidth) / 2;
          const newOffsetY = (gameHeight - newScaledMapHeight) / 2;
          
          // 设置相机边界
          this.cameras.main.setBounds(layerX - newOffsetX/adjustedScaleFactor, layerY - newOffsetY/adjustedScaleFactor, 
                                     mapWidth + newOffsetX*2/adjustedScaleFactor, mapHeight + newOffsetY*2/adjustedScaleFactor);
          
          console.log(`GameScene: 相机设置为调整后的边界，缩放: ${adjustedScaleFactor}`);
        } else {
          // 如果不超出，使用原始设置
          // 设置相机边界为地图的实际位置和尺寸
          this.cameras.main.setBounds(layerX, layerY, mapWidth, mapHeight);
          
          // 将相机定位到地图中心
          const centerX = layerX + mapWidth / 2;
          const centerY = layerY + mapHeight / 2;
          this.cameras.main.centerOn(centerX, centerY);
          
          // 设置相机缩放
          this.cameras.main.setZoom(scaleFactor);
          
          console.log(`GameScene: 相机设置为 bounds(${layerX}, ${layerY}, ${mapWidth}, ${mapHeight}), 缩放: ${scaleFactor}`);
          console.log(`GameScene: 相机中心点设置为 (${centerX}, ${centerY})`);
        }
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