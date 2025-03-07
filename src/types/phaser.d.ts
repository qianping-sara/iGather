// 这个文件用于扩展Phaser类型，解决类型错误
import 'phaser';

declare module 'phaser' {
  namespace Phaser {
    interface Scene {
      add: Phaser.GameObjects.GameObjectFactory;
      cameras: Phaser.Cameras.Scene2D.CameraManager;
      load: Phaser.Loader.LoaderPlugin;
      scene: Phaser.Scenes.ScenePlugin;
      make: Phaser.GameObjects.GameObjectCreator;
      physics: Phaser.Physics.Arcade.ArcadePhysics;
      anims: Phaser.Animations.AnimationManager;
    }

    namespace Physics.Arcade {
      interface Sprite {
        body: Phaser.Physics.Arcade.Body;
        setCollideWorldBounds(value: boolean): this;
        setVelocityX(x: number): this;
        setVelocityY(y: number): this;
        anims: Phaser.GameObjects.Components.Animation;
        texture: Phaser.Textures.Texture;
        scene: Phaser.Scene;
      }
    }
  }
} 