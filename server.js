const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

// GitHub 同步配置
const GH_TOKEN = process.env.GH_TOKEN || '';
const GH_REPO = 'nickyhu1699/traffic-planner';
const GH_FILE = 'data.json';
let ghSha = null; // 缓存 data.json 的 SHA
let syncTimer = null; // 防抖定时器

// 初始化数据文件
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ annotations: [], parkingState: {} }, null, 2));
}

function readData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return { annotations: [], parkingState: {} }; }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  syncToGitHub(); // 写入后同步到 GitHub
}

// ========== GitHub 同步 ==========
function githubRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'api.github.com', path, method,
      headers: {
        'Authorization': `token ${GH_TOKEN}`,
        'User-Agent': 'traffic-planner',
        'Content-Type': 'application/json'
      }
    };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function syncToGitHub() {
  if (!GH_TOKEN) return;
  // 防抖：30秒内只同步一次
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    try {
      // 获取当前 SHA
      const info = await githubRequest('GET', `/repos/${GH_REPO}/contents/${GH_FILE}`);
      if (info.sha) ghSha = info.sha;

      const content = fs.readFileSync(DATA_FILE, 'utf8');
      const result = await githubRequest('PUT', `/repos/${GH_REPO}/contents/${GH_FILE}`, {
        message: 'data: 同步停车数据',
        content: Buffer.from(content).toString('base64'),
        sha: ghSha
      });
      if (result.content && result.content.sha) ghSha = result.content.sha;
      console.log('数据已同步到 GitHub');
    } catch (e) {
      console.warn('GitHub 同步失败:', e.message);
    }
  }, 30000);
}

// 简易 MIME 类型
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // API 路由
  if (req.url === '/api/data' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(readData()));
    return;
  }

  if (req.url === '/api/data' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        writeData(data);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // 只更新停车场车位状态（轻量接口）
  if (req.url === '/api/parking' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const state = JSON.parse(body); // { "A区": 10, "B区": 5 }
        const data = readData();
        data.parkingState = state;
        writeData(data);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400); res.end('{"error":"bad"}');
      }
    });
    return;
  }

  // 静态文件服务
  let filePath = req.url === '/' ? '/index.html' : req.url;
  // /admin → admin.html, /viewer → viewer.html
  if (filePath === '/admin') filePath = '/admin.html';
  if (filePath === '/viewer') filePath = '/viewer.html';

  const fullPath = path.join(PUBLIC_DIR, filePath);
  const ext = path.extname(fullPath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': mime });
      res.end(data);
    }
  });
});

server.listen(PORT, () => {
  console.log(`交通规划系统已启动:`);
  console.log(`  管理页: http://localhost:${PORT}/admin`);
  console.log(`  来宾页: http://localhost:${PORT}/viewer`);
});
