/**
 * 导出工具函数
 * 支持导出为 JSON、图片、PDF 等格式
 */

import { Itinerary, Marker } from '../services/db';

// 导出为 JSON 文件
export function exportAsJSON(data: any, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 从文件导入 JSON
export function importFromJSON<T>(): Promise<T> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          resolve(data);
        } catch (error) {
          reject(new Error('Invalid JSON file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    };

    input.click();
  });
}

// 生成行程列表 HTML
export function generateItineraryListHTML(itinerary: Itinerary & { markers?: Marker[] }): string {
  const itineraryMarkers = itinerary.markers?.filter(m => m.type === 'itinerary') || [];

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${itinerary.name} - 行程列表</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      min-height: 100vh;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 24px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .header {
      text-align: center;
      padding-bottom: 30px;
      border-bottom: 3px solid #f0f0f0;
      margin-bottom: 30px;
    }

    .header h1 {
      font-size: 32px;
      font-weight: 800;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 10px;
    }

    .header .date {
      color: #999;
      font-size: 14px;
    }

    .stats {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin-bottom: 30px;
    }

    .stat {
      text-align: center;
    }

    .stat .number {
      font-size: 36px;
      font-weight: 800;
      color: #667eea;
    }

    .stat .label {
      font-size: 12px;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .location-list {
      list-style: none;
    }

    .location-item {
      display: flex;
      align-items: flex-start;
      padding: 20px;
      margin-bottom: 16px;
      background: #f8f9ff;
      border-radius: 16px;
      border-left: 4px solid #667eea;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .location-item:hover {
      transform: translateX(4px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
    }

    .location-number {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 18px;
      margin-right: 16px;
      flex-shrink: 0;
    }

    .location-info {
      flex: 1;
    }

    .location-name {
      font-size: 18px;
      font-weight: 700;
      color: #333;
      margin-bottom: 6px;
    }

    .location-address {
      font-size: 13px;
      color: #666;
      line-height: 1.5;
    }

    .location-meta {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }

    .badge {
      display: inline-block;
      padding: 4px 10px;
      background: white;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      color: #667eea;
    }

    .location-notes {
      margin-top: 12px;
      padding: 12px;
      background: white;
      border-radius: 10px;
      font-size: 13px;
      color: #666;
      line-height: 1.6;
    }

    .attachments {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 8px;
      margin-top: 12px;
    }

    .attachment-img {
      width: 100%;
      aspect-ratio: 1;
      object-fit: cover;
      border-radius: 10px;
      border: 2px solid #f0f0f0;
    }

    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 30px;
      border-top: 2px solid #f0f0f0;
      color: #999;
      font-size: 13px;
    }

    @media print {
      body {
        background: white;
        padding: 0;
      }

      .container {
        box-shadow: none;
        border-radius: 0;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${itinerary.name}</h1>
      <div class="date">创建于 ${new Date(itinerary.created_at).toLocaleDateString('zh-CN')}</div>
    </div>

    <div class="stats">
      <div class="stat">
        <div class="number">${itineraryMarkers.length}</div>
        <div class="label">地点数量</div>
      </div>
    </div>

    <ul class="location-list">
      ${itineraryMarkers.map((marker, index) => `
        <li class="location-item">
          <div class="location-number">${index + 1}</div>
          <div class="location-info">
            <div class="location-name">${marker.name}</div>
            <div class="location-address">${marker.address || '无详细地址'}</div>
            ${marker.category ? `<div class="location-meta"><span class="badge">${marker.category}</span></div>` : ''}
            ${marker.notes ? `<div class="location-notes">${marker.notes}</div>` : ''}
            ${marker.attachments && marker.attachments.length > 0 ? `
              <div class="attachments">
                ${marker.attachments.map(att => `
                  <img src="${att.url}" class="attachment-img" alt="附件" />
                `).join('')}
              </div>
            ` : ''}
          </div>
        </li>
      `).join('')}
    </ul>

    <div class="footer">
      由 RoutePlanner 生成 · ${new Date().toLocaleString('zh-CN')}
    </div>
  </div>
</body>
</html>
  `;
}

// 导出行程列表为 HTML 文件
export function exportItineraryList(itinerary: Itinerary & { markers?: Marker[] }) {
  const html = generateItineraryListHTML(itinerary);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${itinerary.name}-行程列表.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 生成地图预览图片（使用 canvas 绘制简化版地图）
export function generateMapPreview(markers: Marker[], width: number = 1200, height: number = 800): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas not supported'));
      return;
    }

    // 背景
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 标题
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('行程地图预览', width / 2, 80);

    if (markers.length === 0) {
      ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText('暂无地点标记', width / 2, height / 2);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob'));
      }, 'image/png');
      return;
    }

    // 计算边界
    const padding = 100;
    const mapArea = {
      x: padding,
      y: 150,
      width: width - padding * 2,
      height: height - 200
    };

    // 计算坐标范围
    const lats = markers.map(m => m.lat);
    const lngs = markers.map(m => m.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latRange = maxLat - minLat || 1;
    const lngRange = maxLng - minLng || 1;

    // 坐标转换函数
    const toCanvasCoords = (lat: number, lng: number) => ({
      x: mapArea.x + ((lng - minLng) / lngRange) * mapArea.width,
      y: mapArea.y + mapArea.height - ((lat - minLat) / latRange) * mapArea.height
    });

    // 绘制连接线
    const itineraryMarkers = markers.filter(m => m.type === 'itinerary').sort((a, b) => a.order_index - b.order_index);
    if (itineraryMarkers.length > 1) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      const first = toCanvasCoords(itineraryMarkers[0].lat, itineraryMarkers[0].lng);
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < itineraryMarkers.length; i++) {
        const coords = toCanvasCoords(itineraryMarkers[i].lat, itineraryMarkers[i].lng);
        ctx.lineTo(coords.x, coords.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 绘制标记点
    markers.forEach((marker, index) => {
      const coords = toCanvasCoords(marker.lat, marker.lng);
      const isItinerary = marker.type === 'itinerary';

      // 绘制点
      ctx.beginPath();
      ctx.arc(coords.x, coords.y, 16, 0, Math.PI * 2);
      ctx.fillStyle = isItinerary ? '#FF6B9D' : '#FFD93D';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 3;
      ctx.stroke();

      // 绘制序号或图标
      ctx.fillStyle = 'white';
      ctx.font = 'bold 14px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (isItinerary) {
        const order = itineraryMarkers.findIndex(m => m.id === marker.id) + 1;
        ctx.fillText(order.toString(), coords.x, coords.y);
      } else {
        ctx.fillText('★', coords.x, coords.y);
      }

      // 绘制名称
      ctx.fillStyle = 'white';
      ctx.font = '16px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(marker.name, coords.x, coords.y + 35);
    });

    // 底部信息
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '18px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`共 ${markers.length} 个地点 · 由 RoutePlanner 生成`, width / 2, height - 40);

    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create blob'));
    }, 'image/png');
  });
}

// 导出地图预览图片
export async function exportMapPreview(markers: Marker[]) {
  try {
    const blob = await generateMapPreview(markers);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `行程地图-${new Date().toLocaleDateString('zh-CN')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export map preview:', error);
    throw error;
  }
}
