# iRent 智能車況管家 Prototype

2026 和泰 AI 黑客松 iRent 賽道作品（團隊：只要能Run就好）

用 AI 優化 iRent 取還車體驗：
- 拍攝當下即時防呆（光線、模糊、角度、車牌）
- 取還車照片比對，只抓「本次新增」的車損
- 車內清潔度三級分類（乾淨／普通／髒汙）
- 客服／營運後台即時預警與派工流程

## 本機執行

需要 Node.js 18+，無需 npm install。

```bash
cp .env.example .env   # 填入 GEMINI_API_KEY（可省略，省略時僅模擬模式）
node server.js
```

開啟 http://localhost:3000

## 頁面

- `/` 租客端（手機版 App，流程參考 iRent：檢視車況→確認取車→租用中→還車拍照→停車位置→付款→鎖車，含車況回報）
- `/admin` 客服／營運後台（即時預警、前後對照、處理流程）
- `/demo` 左右分割畫面（租客端＋後台，Demo 現場用）

兩端透過伺服器共享狀態即時同步（記憶體內，服務重啟會重置；Cloud Run 需設 `--max-instances 1`）。

## 使用方式

- 右上角「Demo 情境」：無異常／還車新增凹陷／還車後座髒汙／取車承接髒車
- 手機畫面可用內建示範照片，或上傳／拍攝真實照片；「⚡ 自動拍完」可一鍵跑完整流程
- 勾選「AI 模式」會把照片送 Gemini（gemini-2.5-flash）判讀；未勾選為模擬結果，但照片亮度與清晰度檢查仍是真實運算
- API key 只在伺服器端使用，不會送到瀏覽器；公開部署時 `/api/analyze` 有請求頻率限制

## 部署（Google Cloud Run）

```bash
gcloud run deploy irent-car-check --source . --region asia-east1 --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=你的金鑰
```
