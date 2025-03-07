import * as Phaser from 'phaser';

interface GameSceneWithGroups extends Phaser.Scene {
  wallsGroup?: Phaser.Physics.Arcade.StaticGroup;
  obstaclesGroup?: Phaser.Physics.Arcade.StaticGroup;
}

// 创建一个简单的程序化地图
export function createDemoMap(scene: Phaser.Scene): Phaser.Tilemaps.Tilemap {
  // 创建一个20x15的地图数据
  const mapData = [];
  const width = 20;
  const height = 15;
  
  // 生成基本地形
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      // 边界墙
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        row.push(2); // 墙壁tile
      } else {
        // 随机生成一些障碍物
        row.push(Math.random() < 0.1 ? 3 : 1); // 1为地面，3为障碍物
      }
    }
    mapData.push(row);
  }
  
  // 创建地图
  const map = scene.make.tilemap({
    data: mapData,
    tileWidth: 32,
    tileHeight: 32,
    width: width,
    height: height
  });
  
  return map;
}

// 创建一个简单的彩色矩形地图（不需要tileset）
export function createSimpleTilemap(scene: GameSceneWithGroups): void {
  const width = 800;
  const height = 600;
  
  // 创建地面
  const ground = scene.add.rectangle(0, 0, width, height, 0x88aa88);
  ground.setOrigin(0, 0);
  ground.setDepth(0);
  
  // 创建边界墙
  const wallThickness = 32;
  const walls = [
    { x: 0, y: 0, width: width, height: wallThickness }, // 上
    { x: 0, y: height - wallThickness, width: width, height: wallThickness }, // 下
    { x: 0, y: 0, width: wallThickness, height: height }, // 左
    { x: width - wallThickness, y: 0, width: wallThickness, height: height } // 右
  ];
  
  // 创建静态物理组
  const wallsGroup = scene.physics.add.staticGroup();
  
  // 添加墙壁到物理组
  walls.forEach(wall => {
    const rect = scene.add.rectangle(wall.x, wall.y, wall.width, wall.height, 0x666666);
    rect.setOrigin(0, 0);
    rect.setDepth(1);
    
    // 添加到物理组
    wallsGroup.add(rect);
  });
  
  // 添加一些随机障碍物
  const obstaclesGroup = scene.physics.add.staticGroup();
  for (let i = 0; i < 10; i++) {
    const x = Phaser.Math.Between(wallThickness + 32, width - wallThickness - 32);
    const y = Phaser.Math.Between(wallThickness + 32, height - wallThickness - 32);
    const obstacle = scene.add.rectangle(x, y, 32, 32, 0x994444);
    obstacle.setDepth(1);
    
    // 添加到物理组
    obstaclesGroup.add(obstacle);
  }
  
  // 保存物理组到场景
  scene.wallsGroup = wallsGroup;
  scene.obstaclesGroup = obstaclesGroup;
  
  console.log('创建简单地图完成，包含墙壁和障碍物');
} 