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
  public objectsBLayer?: Phaser.Tilemaps.TilemapLayer;
  public objectsCLayer?: Phaser.Tilemaps.TilemapLayer;
  private playerDebugText?: Phaser.GameObjects.Text;
  private lastEffectTime?: number;
  private specialTileMarkers?: Array<Phaser.GameObjects.GameObject>;
  private activeBubble?: { graphics: Phaser.GameObjects.Graphics, text: Phaser.GameObjects.Text };
  private lastCollisionTile?: { index: number, x: number, y: number };
  
  constructor() {
    super('GameScene');
  }

  create(): void {
    try {
      console.log('GameScene: 开始创建场景');
      
      // 初始化特殊对象标记数组
      this.specialTileMarkers = [];
      
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
      
      // 记录地图中所有125、126、127、128对象的位置，但不显示红色蒙版
      this.logSpecificTilePositions();
      
      // 检查和修复手动添加的125、126、127、128对象
      this.fixManuallyAddedTiles();
      
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
      
      // 打印地图信息
      console.log(`GameScene: 地图尺寸: ${this.map.width}x${this.map.height}, 瓦片尺寸: ${this.map.tileWidth}x${this.map.tileHeight}`);
      console.log(`GameScene: 地图图层:`, this.map.layers.map(layer => layer.name));
      
      // 添加图块集
      const tileset = this.map.addTilesetImage('tilemap_packed', 'tilemap_packed');
      console.log('GameScene: 图块集添加结果', tileset);
      
      if (!tileset) {
        throw new Error('无法加载海盗主题tileset');
      }
      
      // 打印图块集信息
      console.log(`GameScene: 图块集信息 - 名称: ${tileset.name}, 首个瓦片ID: ${tileset.firstgid}, 瓦片数量: ${tileset.total}`);
      
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
        
        if (objectsBLayer) {
          console.log('GameScene: Objects B图层创建成功');
          // 保存为类属性以便后续使用
          this.objectsBLayer = objectsBLayer;
        }
        if (objectsCLayer) {
          console.log('GameScene: Objects C图层创建成功');
          // 保存为类属性以便后续使用
          this.objectsCLayer = objectsCLayer;
        }
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
      
      // 主动检测与特定对象的碰撞
      this.checkSpecificTileCollisions();
      
      // 直接检查玩家是否与任何瓦片重叠
      this.checkDirectOverlap();
      
      // 不再显示玩家位置信息
      if (this.playerDebugText) {
        this.playerDebugText.setVisible(false);
        // 完全移除这个文本对象
        this.playerDebugText.destroy();
        this.playerDebugText = undefined;
      }
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
      
      // 确保所有图层的所有瓦片都设置了碰撞属性，优先处理Objects C层
      this.setAllTilesCollision(this.objectsCLayer, 'Objects C', 'high');
      this.setAllTilesCollision(this.obstaclesLayer, 'Objects A', 'low');
      this.setAllTilesCollision(this.objectsBLayer, 'Objects B', 'low');
      
      // 优先处理Objects C层的碰撞
      if (this.objectsCLayer && this.player) {
        console.log('GameScene: 添加玩家与Objects C图层的碰撞（优先级：高）');
        
        // 首先设置碰撞属性
        const width = this.objectsCLayer.width;
        const height = this.objectsCLayer.height;
        
        // 记录特殊对象的位置，以便调试
        const specialTiles = [];
        
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const tile = this.objectsCLayer.getTileAt(x, y);
            if (tile && tile.index > 0) {
              // 特别关注125-128的对象
              if (tile.index === 125 || tile.index === 126 || tile.index === 127 || tile.index === 128) {
                console.log(`GameScene: 在Objects C图层找到特定对象 ${tile.index} 在位置 (${x}, ${y})`);
                specialTiles.push({ x, y, index: tile.index });
                
                // 确保设置了碰撞属性
                if (!tile.collides) {
                  tile.setCollision(true);
                  console.log(`GameScene: 为特定对象 ${tile.index} 设置碰撞属性`);
                }
              } else {
                // 为其他对象也设置碰撞
                tile.setCollision(true);
              }
            }
          }
        }
        
        console.log(`GameScene: Objects C图层中找到 ${specialTiles.length} 个特殊对象:`, specialTiles);
        
        // 添加碰撞器，使用processCallback确保碰撞检测正确
        this.physics.add.collider(
          this.player,
          this.objectsCLayer,
          (player: Phaser.GameObjects.GameObject, tile: Phaser.Tilemaps.Tile) => {
            // 获取瓦片索引
            const tileIndex = tile.index;
            
            // 检查是否是特定对象 (125, 126, 127, 128)
            if (tileIndex === 125 || tileIndex === 126 || tileIndex === 127 || tileIndex === 128) {
              console.log(`GameScene: 玩家碰撞到Objects C图层的特定对象 ${tileIndex}，位置: (${tile.x}, ${tile.y})`);
              this.setDebugText(`碰撞对象C: ${tileIndex}`);
            }
          },
          (player: Phaser.Types.Physics.Arcade.GameObjectWithBody, tile: Phaser.Tilemaps.Tile) => {
            // 特别关注125-128的对象
            if (tile.index === 125 || tile.index === 126 || tile.index === 127 || tile.index === 128) {
              // 获取玩家的边界
              const playerBounds = player.getBounds();
              
              // 获取瓦片的边界
              const tileBounds = new Phaser.Geom.Rectangle(
                tile.pixelX + (this.objectsCLayer?.x || 0), 
                tile.pixelY + (this.objectsCLayer?.y || 0), 
                tile.width, 
                tile.height
              );
              
              // 检查是否有重叠
              const overlap = Phaser.Geom.Rectangle.Overlaps(playerBounds, tileBounds);
              
              if (overlap) {
                console.log(`GameScene: 玩家与特定对象 ${tile.index} 重叠检测成功`);
              }
              
              // 返回是否重叠
              return overlap;
            }
            
            // 对于非特殊对象，使用默认的碰撞检测
            return true;
          }
        );
      }
      
      // 与地图图层的碰撞
      if (this.obstaclesLayer && this.player) {
        console.log('GameScene: 添加玩家与障碍物图层的碰撞');
        
        // 使用自定义碰撞处理，考虑玩家的边缘
        this.physics.add.collider(
          this.player, 
          this.obstaclesLayer,
          (player: Phaser.GameObjects.GameObject, tile: Phaser.Tilemaps.Tile) => {
            // 获取瓦片索引
            const tileIndex = tile.index;
            
            // 检查是否是特定对象 (125, 126, 127, 128)
            if (tileIndex === 125 || tileIndex === 126 || tileIndex === 127 || tileIndex === 128) {
              console.log(`GameScene: 玩家碰撞到特定对象 ${tileIndex}，位置: (${tile.x}, ${tile.y})`);
              this.setDebugText(`碰撞对象: ${tileIndex}`);
            }
          },
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
      }
      
      // 为Objects B图层设置碰撞
      if (this.objectsBLayer && this.player) {
        console.log('GameScene: 添加玩家与Objects B图层的碰撞');
        
        // 首先设置碰撞属性
        const width = this.objectsBLayer.width;
        const height = this.objectsBLayer.height;
        
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const tile = this.objectsBLayer.getTileAt(x, y);
            if (tile && tile.index > 0) {
              // 特别关注125-128的对象
              if (tile.index === 125 || tile.index === 126 || tile.index === 127 || tile.index === 128) {
                console.log(`GameScene: 在Objects B图层找到特定对象 ${tile.index} 在位置 (${x}, ${y})`);
              }
              tile.setCollision(true);
            }
          }
        }
        
        // 添加碰撞器
        this.physics.add.collider(
          this.player,
          this.objectsBLayer,
          (player: Phaser.GameObjects.GameObject, tile: Phaser.Tilemaps.Tile) => {
            // 获取瓦片索引
            const tileIndex = tile.index;
            
            // 检查是否是特定对象 (125, 126, 127, 128)
            if (tileIndex === 125 || tileIndex === 126 || tileIndex === 127 || tileIndex === 128) {
              console.log(`GameScene: 玩家碰撞到Objects B图层的特定对象 ${tileIndex}，位置: (${tile.x}, ${tile.y})`);
              this.setDebugText(`碰撞对象B: ${tileIndex}`);
            }
          }
        );
      }
      
      // 设置碰撞回调，用于调试
      this.physics.world.on('collide', (gameObject1: Phaser.GameObjects.GameObject, gameObject2: Phaser.GameObjects.GameObject) => {
        if (gameObject1 === this.player || gameObject2 === this.player) {
          // 玩家碰撞事件
          console.log('GameScene: 玩家发生碰撞');
          
          // 检查是否与特定对象碰撞
          if (gameObject1 !== this.player && 'index' in gameObject1) {
            const tileIndex = gameObject1.index;
            if (tileIndex === 125 || tileIndex === 126 || tileIndex === 127 || tileIndex === 128) {
              console.log(`GameScene: 玩家碰撞到特定对象 ${tileIndex}`);
              this.setDebugText(`碰撞对象: ${tileIndex}`);
            }
          } else if (gameObject2 !== this.player && 'index' in gameObject2) {
            const tileIndex = gameObject2.index;
            if (tileIndex === 125 || tileIndex === 126 || tileIndex === 127 || tileIndex === 128) {
              console.log(`GameScene: 玩家碰撞到特定对象 ${tileIndex}`);
              this.setDebugText(`碰撞对象: ${tileIndex}`);
            }
          }
        }
      });
      
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

  // 检查与特定对象的碰撞
  private checkSpecificTileCollisions(): void {
    // 获取玩家的位置和边界
    const playerBounds = this.player.getBounds();
    
    // 记录玩家位置，帮助调试
    // console.log(`GameScene: 玩家当前位置 (${this.player.x}, ${this.player.y})`);
    
    // 检查Objects A图层中的特定对象 - 这里有127和128
    if (this.obstaclesLayer) {
      this.checkLayerForSpecificTiles(this.obstaclesLayer, playerBounds, 'A');
    }
    
    // 检查Objects B图层中的特定对象
    if (this.objectsBLayer) {
      this.checkLayerForSpecificTiles(this.objectsBLayer, playerBounds, 'B');
    }
    
    // 检查Objects C图层中的特定对象
    if (this.objectsCLayer) {
      this.checkLayerForSpecificTiles(this.objectsCLayer, playerBounds, 'C');
    }
  }
  
  // 在指定图层中检查特定对象
  private checkLayerForSpecificTiles(layer: Phaser.Tilemaps.TilemapLayer, playerBounds: Phaser.Geom.Rectangle, layerName: string): void {
    // 计算玩家所在的瓦片坐标范围
    const tileWidth = layer.tilemap.tileWidth;
    const tileHeight = layer.tilemap.tileHeight;
    
    // 扩大检查范围，确保能捕获到所有可能的碰撞
    const x1 = Math.floor(playerBounds.left / tileWidth) - 1;
    const y1 = Math.floor(playerBounds.top / tileHeight) - 1;
    const x2 = Math.ceil(playerBounds.right / tileWidth) + 1;
    const y2 = Math.ceil(playerBounds.bottom / tileHeight) + 1;
    
    // 记录检查的瓦片范围
    // console.log(`GameScene: 检查图层 ${layerName} 中的瓦片范围 (${x1},${y1}) 到 (${x2},${y2})`);
    
    // 遍历玩家周围的瓦片
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        const tile = layer.getTileAt(x, y);
        if (tile) {
          // 记录找到的所有瓦片，帮助调试
          console.log(`GameScene: 图层 ${layerName} 在位置 (${x},${y}) 找到瓦片 ${tile.index}`);
          
          // 检查所有非零瓦片的碰撞
          if (tile.index > 0) {
            // 计算瓦片的边界
            const tileBounds = new Phaser.Geom.Rectangle(
              tile.pixelX + layer.x,
              tile.pixelY + layer.y,
              tile.width,
              tile.height
            );
            
            // 检查是否与玩家碰撞
            if (Phaser.Geom.Rectangle.Overlaps(playerBounds, tileBounds)) {
              console.log(`GameScene: 玩家碰撞到Objects ${layerName}图层的对象 ${tile.index}，位置: (${x}, ${y})`);
              this.setDebugText(`碰撞对象${layerName}: ${tile.index}`);
              
              // 特别关注127和128
              if (tile.index === 127 || tile.index === 128) {
                console.log(`GameScene: 玩家碰撞到特定对象 ${tile.index}！！！`);
                this.setDebugText(`碰撞特定对象: ${tile.index}`);
              }
            }
          }
        }
      }
    }
  }

  // 记录地图中所有125、126、127、128对象的位置
  private logSpecificTilePositions(): void {
    console.log('GameScene: 开始记录地图中所有125、126、127、128对象的位置');
    
    // 打印地图信息
    if (this.map) {
      console.log(`GameScene: 地图尺寸: ${this.map.width}x${this.map.height}, 瓦片尺寸: ${this.map.tileWidth}x${this.map.tileHeight}`);
      console.log(`GameScene: 地图像素尺寸: ${this.map.widthInPixels}x${this.map.heightInPixels}`);
    }
    
    // 清除之前的标记
    this.clearSpecialTileMarkers();
    
    // 重点检查Objects C图层，因为125-128对象现在都在这一层
    if (this.objectsCLayer) {
      console.log('GameScene: 重点检查Objects C图层，因为125-128对象现在都在这一层');
      this.logLayerSpecificTiles(this.objectsCLayer, 'C');
    }
    
    // 也检查其他图层，以防万一
    if (this.obstaclesLayer) {
      this.logLayerSpecificTiles(this.obstaclesLayer, 'A');
    }
    
    if (this.objectsBLayer) {
      this.logLayerSpecificTiles(this.objectsBLayer, 'B');
    }
    
    // 添加一个特殊的标记，帮助在控制台中找到这些日志
    console.log('=== 特定对象位置记录完成 ===');
  }
  
  // 清除特殊对象标记
  private clearSpecialTileMarkers(): void {
    if (this.specialTileMarkers && this.specialTileMarkers.length > 0) {
      console.log(`GameScene: 清除 ${this.specialTileMarkers.length} 个特殊对象标记`);
      this.specialTileMarkers.forEach(marker => {
        if (marker && marker.destroy) {
          marker.destroy();
        }
      });
      this.specialTileMarkers = [];
    }
  }
  
  // 记录指定图层中的特定对象
  private logLayerSpecificTiles(layer: Phaser.Tilemaps.TilemapLayer, layerName: string): void {
    const width = layer.width;
    const height = layer.height;
    let count = 0;
    
    // 获取图层的偏移量
    const layerX = layer.x || 0;
    const layerY = layer.y || 0;
    
    console.log(`GameScene: 检查图层 ${layerName} 中的特定对象，图层位置: (${layerX}, ${layerY}), 尺寸: ${width}x${height}`);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = layer.getTileAt(x, y);
        if (tile) {
          // 特别关注125、126、127和128
          if (tile.index === 125 || tile.index === 126 || tile.index === 127 || tile.index === 128) {
            count++;
            // 计算瓦片的像素位置
            const tilePixelX = tile.pixelX + layerX;
            const tilePixelY = tile.pixelY + layerY;
            
            // 打印瓦片的完整属性
            console.log(`GameScene: 在图层 ${layerName} 位置 (${x}, ${y}) 找到特定对象 ${tile.index}，像素位置: (${tilePixelX}, ${tilePixelY})`);
            
            // 确保瓦片设置了碰撞属性
            tile.setCollision(true);
            
            // 不再添加任何标签
          }
        }
      }
    }
    
    console.log(`GameScene: 图层 ${layerName} 中共找到 ${count} 个特定对象`);
  }

  // 为所有瓦片设置碰撞属性
  private setAllTilesCollision(layer: Phaser.Tilemaps.TilemapLayer | undefined, layerName: string, priority: string = 'normal'): void {
    if (!layer) {
      console.log(`GameScene: 图层 ${layerName} 不存在，跳过碰撞设置`);
      return;
    }
    
    console.log(`GameScene: 为图层 ${layerName} 设置所有瓦片的碰撞属性 (优先级: ${priority})`);
    
    const width = layer.width;
    const height = layer.height;
    let collisionCount = 0;
    let specialTileCount = 0;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = layer.getTileAt(x, y);
        if (tile && tile.index > 0) {
          tile.setCollision(true);
          collisionCount++;
          
          // 特别关注125-128
          if (tile.index === 125 || tile.index === 126 || tile.index === 127 || tile.index === 128) {
            specialTileCount++;
            console.log(`GameScene: 为图层 ${layerName} 中的特定对象 ${tile.index} 设置碰撞，位置: (${x}, ${y})`);
          }
        }
      }
    }
    
    console.log(`GameScene: 图层 ${layerName} 中共设置了 ${collisionCount} 个瓦片的碰撞属性，其中特殊对象 ${specialTileCount} 个`);
  }

  // 直接检查玩家是否与任何瓦片重叠
  private checkDirectOverlap(): void {
    if (!this.player || !this.map) return;
    
    // 获取玩家的位置和边界
    const playerX = this.player.x;
    const playerY = this.player.y;
    const playerBounds = this.player.getBounds();
    
    // 打印玩家边界信息，帮助调试（减少日志频率）
    if (Math.random() < 0.1) { // 只有10%的几率打印，减少日志量
      console.log(`GameScene: 玩家边界 - 左: ${playerBounds.left}, 上: ${playerBounds.top}, 右: ${playerBounds.right}, 下: ${playerBounds.bottom}, 宽: ${playerBounds.width}, 高: ${playerBounds.height}`);
    }
    
    // 检查所有图层，但优先检查Objects C层
    const layers = [
      { layer: this.objectsCLayer, name: 'Objects C', priority: 'high' },
      { layer: this.obstaclesLayer, name: 'Objects A', priority: 'low' },
      { layer: this.objectsBLayer, name: 'Objects B', priority: 'low' }
    ];
    
    // 用于跟踪是否已经找到碰撞
    let collisionFound = false;
    
    for (const { layer, name } of layers) {
      if (!layer || collisionFound) continue; // 如果已经找到碰撞，跳过其他图层
      
      // 获取图层的偏移量
      const layerX = layer.x || 0;
      const layerY = layer.y || 0;
      
      // 将玩家位置转换为相对于图层的位置
      const relativeX = playerX - layerX;
      const relativeY = playerY - layerY;
      
      // 将相对位置转换为瓦片坐标
      const tileX = Math.floor(relativeX / this.map.tileWidth);
      const tileY = Math.floor(relativeY / this.map.tileHeight);
      
      // 检查玩家所在的瓦片及周围的瓦片
      for (let y = tileY - 2; y <= tileY + 2; y++) {
        for (let x = tileX - 2; x <= tileX + 2; x++) {
          // 确保坐标在图层范围内
          if (x >= 0 && x < layer.width && y >= 0 && y < layer.height) {
            const tile = layer.getTileAt(x, y);
            if (tile && tile.index > 0) {
              // 计算瓦片的像素位置
              const tilePixelX = tile.pixelX + layerX;
              const tilePixelY = tile.pixelY + layerY;
              
              // 计算瓦片的边界
              const tileBounds = new Phaser.Geom.Rectangle(
                tilePixelX,
                tilePixelY,
                tile.width,
                tile.height
              );
              
              // 检查是否与玩家重叠
              const overlaps = Phaser.Geom.Rectangle.Overlaps(playerBounds, tileBounds);
              
              // 特别关注125、126、127和128
              if (tile.index === 125 || tile.index === 126 || tile.index === 127 || tile.index === 128) {
                if (overlaps) {
                  collisionFound = true;
                  
                  // 检查这个碰撞是否与上一次相同
                  const isSameCollision = this.lastCollisionTile && 
                                         this.lastCollisionTile.index === tile.index &&
                                         this.lastCollisionTile.x === x &&
                                         this.lastCollisionTile.y === y;
                  
                  // 只有当没有活跃气泡，或者碰撞对象与上次不同时，才创建新气泡
                  if (!this.activeBubble || !isSameCollision) {
                    console.log(`GameScene: 玩家与特定对象 ${tile.index} 重叠！！！ 位置: (${x}, ${y}), 图层: ${name}`);
                    this.setDebugText(`重叠特定对象: ${tile.index}`);
                    
                    // 移除现有气泡（如果有）
                    this.removeBubble();
                    
                    // 记录当前碰撞对象
                    this.lastCollisionTile = { index: tile.index, x, y };
                    
                    // 创建新气泡
                    this.createBubble(playerX, playerY, tile.index, x, y);
                  }
                  
                  // 找到碰撞后立即返回，不再检查其他瓦片
                  return;
                }
              }
            }
          }
        }
      }
    }
    
    // 如果没有找到任何碰撞，但之前有碰撞对象，则移除气泡
    if (!collisionFound && this.lastCollisionTile) {
      this.removeBubble();
      this.lastCollisionTile = undefined;
    }
  }
  
  // 创建对话气泡
  private createBubble(playerX: number, playerY: number, tileIndex: number, tileX: number, tileY: number): void {
    // 根据特定对象显示不同的欢迎语
    let message = '';
    let bgColor = 'rgba(255,255,255,0.9)'; // 默认使用白色背景
    let textColor = '#000000'; // 默认使用黑色文字
    
    switch(tileIndex) {
      case 125: // 八卦传播者
        message = "我知道了一个秘密，我告诉你但你别讲出去哈！";
        bgColor = 'rgba(255,192,203,0.9)'; // 浅粉色背景
        textColor = '#000000';
        break;
      case 126: // 用户画像创建者
        message = "你好！我是用户画像创建者。需要我帮你分析用户画像吗？";
        bgColor = 'rgba(173,216,230,0.9)'; // 浅蓝色背景
        textColor = '#000000';
        break;
      case 127: // 创意激发者
        message = "嗨！我可以用'How might we'方法帮你激发创意！";
        bgColor = 'rgba(144,238,144,0.9)'; // 浅绿色背景
        textColor = '#000000';
        break;
      case 128: // 需求讨论者
        message = "你好！我是需求讨论者，我可以帮你分析epic需求。";
        bgColor = 'rgba(255,218,185,0.9)'; // 浅橙色背景
        textColor = '#000000';
        break;
    }
    
    // 创建对话气泡
    const bubble = this.add.graphics();
    const bubblePadding = 4; // 进一步减小内边距
    
    // 根据对象在地图上的位置调整气泡位置
    let offsetY = -25; // 默认向上偏移
    let offsetX = 0;   // 默认无水平偏移
    
    // 处理125和126的特殊情况
    if (tileIndex === 125 || tileIndex === 126) {
      if (tileY < 4) { // 靠近地图顶部
        offsetY = 25; // 向下偏移
      }
      
      // 检查是否靠近左右边缘
      if (tileX < 4) { // 靠近左边缘
        offsetX = 15; // 向右偏移
      } else if (tileX > (this.map?.width || 0) - 4) { // 靠近右边缘
        offsetX = -15; // 向左偏移
      }
    }
    
    // 创建文本消息
    const messageText = this.add.text(playerX + offsetX, playerY + offsetY, message, {
      fontSize: '10px',
      fontStyle: 'bold',
      color: textColor,
      align: 'center',
      wordWrap: { width: 110 } // 进一步减小文本宽度
    });
    messageText.setOrigin(0.5, 0.5);
    messageText.setDepth(1002);
    
    // 画对话气泡
    const bubbleWidth = messageText.width + bubblePadding * 2;
    const bubbleHeight = messageText.height + bubblePadding * 2;
    const bubbleX = playerX + offsetX - bubbleWidth / 2;
    const bubbleY = playerY + offsetY - bubbleHeight / 2;
    
    bubble.fillStyle(Phaser.Display.Color.ValueToColor(bgColor).color, 0.9);
    bubble.fillRoundedRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 4);
    bubble.lineStyle(1, 0x000000, 0.5);
    bubble.strokeRoundedRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 4);
    bubble.setDepth(1001);
    
    // 添加指向玩家的三角形，根据气泡位置调整三角形方向和位置
    bubble.fillStyle(Phaser.Display.Color.ValueToColor(bgColor).color, 0.9);
    
    // 根据偏移方向确定三角形位置
    if (offsetY < 0) { // 气泡在角色上方
      bubble.fillTriangle(
        playerX + offsetX * 0.3, bubbleY + bubbleHeight, // 三角形尖端靠近玩家
        playerX + offsetX * 0.3 - 4, bubbleY + bubbleHeight - 4,
        playerX + offsetX * 0.3 + 4, bubbleY + bubbleHeight - 4
      );
      // 三角形边框
      bubble.lineStyle(1, 0x000000, 0.5);
      bubble.lineBetween(playerX + offsetX * 0.3 - 4, bubbleY + bubbleHeight - 4, playerX + offsetX * 0.3, bubbleY + bubbleHeight);
      bubble.lineBetween(playerX + offsetX * 0.3, bubbleY + bubbleHeight, playerX + offsetX * 0.3 + 4, bubbleY + bubbleHeight - 4);
    } else { // 气泡在角色下方
      bubble.fillTriangle(
        playerX + offsetX * 0.3, bubbleY, // 三角形尖端靠近玩家
        playerX + offsetX * 0.3 - 4, bubbleY + 4,
        playerX + offsetX * 0.3 + 4, bubbleY + 4
      );
      // 三角形边框
      bubble.lineStyle(1, 0x000000, 0.5);
      bubble.lineBetween(playerX + offsetX * 0.3 - 4, bubbleY + 4, playerX + offsetX * 0.3, bubbleY);
      bubble.lineBetween(playerX + offsetX * 0.3, bubbleY, playerX + offsetX * 0.3 + 4, bubbleY + 4);
    }
    
    // 保存活跃气泡引用
    this.activeBubble = {
      graphics: bubble,
      text: messageText
    };
    
    // 3秒后自动移除气泡
    this.time.delayedCall(3000, () => {
      this.removeBubble();
    });
  }
  
  // 移除对话气泡
  private removeBubble(): void {
    if (this.activeBubble) {
      this.activeBubble.graphics.destroy();
      this.activeBubble.text.destroy();
      this.activeBubble = undefined;
    }
  }

  // 检查和修复手动添加的125、126、127、128对象
  private fixManuallyAddedTiles(): void {
    console.log('GameScene: 开始检查和修复手动添加的125、126、127、128对象');
    
    if (!this.map) return;
    
    // 获取所有图层，但重点关注Objects C层
    const layers = [
      { layer: this.objectsCLayer, name: 'Objects C', priority: 'high' },
      { layer: this.obstaclesLayer, name: 'Objects A', priority: 'low' },
      { layer: this.objectsBLayer, name: 'Objects B', priority: 'low' }
    ];
    
    for (const { layer, name, priority } of layers) {
      if (!layer) continue;
      
      console.log(`GameScene: 检查图层 ${name} 中的手动添加对象 (优先级: ${priority})`);
      
      // 遍历整个图层
      for (let y = 0; y < layer.height; y++) {
        for (let x = 0; x < layer.width; x++) {
          const tile = layer.getTileAt(x, y);
          
          // 检查是否是125、126、127或128对象
          if (tile && (tile.index === 125 || tile.index === 126 || tile.index === 127 || tile.index === 128)) {
            console.log(`GameScene: 在图层 ${name} 位置 (${x}, ${y}) 找到对象 ${tile.index}`);
            
            // 检查碰撞属性
            if (!tile.collides) {
              console.log(`GameScene: 对象 ${tile.index} 没有设置碰撞属性，正在修复...`);
              
              // 设置碰撞属性
              tile.setCollision(true);
              
              // 验证修复结果
              console.log(`GameScene: 对象 ${tile.index} 碰撞属性修复后:`, {
                collides: tile.collides,
                canCollide: tile.canCollide
              });
              
              // 不再添加任何标记
            }
          }
        }
      }
    }
    
    console.log('GameScene: 手动添加对象检查和修复完成');
  }
} 