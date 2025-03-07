import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(__dirname, '../public/assets/avatars/npc');
const targetDir = path.join(__dirname, '../public/assets/avatars/npc/32x32');

// 确保目标目录存在
await fs.mkdir(targetDir, { recursive: true }).catch(() => {});

// 处理所有PNG文件
const files = await fs.readdir(sourceDir);
for (const file of files) {
  if (file.endsWith('.png')) {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);
    
    try {
      // 获取原始图片的元数据
      const metadata = await sharp(sourcePath).metadata();
      const originalWidth = metadata.width || 0;
      const originalHeight = metadata.height || 0;
      
      // 计算合适的缩放尺寸，确保图片在32x32的区域内居中
      const targetSize = 24; // 实际图片大小设为24x24，留出边距
      const scale = Math.min(targetSize / originalWidth, targetSize / originalHeight);
      const newWidth = Math.round(originalWidth * scale);
      const newHeight = Math.round(originalHeight * scale);
      
      // 计算居中的偏移量
      const left = Math.floor((32 - newWidth) / 2);
      const top = Math.floor((32 - newHeight) / 2);
      
      await sharp(sourcePath)
        .resize(newWidth, newHeight, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .extend({
          top: top,
          bottom: 32 - newHeight - top,
          left: left,
          right: 32 - newWidth - left,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toFile(targetPath);
      
      console.log(`处理完成: ${file} (${newWidth}x${newHeight}, 偏移: ${left},${top})`);
    } catch (err) {
      console.error(`处理失败 ${file}:`, err);
    }
  }
} 