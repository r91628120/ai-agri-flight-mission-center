# AI農業飛行任務中心

**English name:** AI Agriculture Flight Mission Center  
**Repository:** `ai-agri-flight-mission-center`

以 Mission First（任務優先）為首頁設計核心，協助使用者從「今天想完成哪一項農業任務？」開始，逐步找到飛行、巡田、天氣、衛星、植保與 AI 協助等入口。

## 目前範圍

- 原生 HTML、CSS、JavaScript
- GitHub Pages 可直接執行的單頁首頁
- 響應式桌面、平板與手機版
- 展示六大任務、今日資訊、AI 工具、官方入口與新手知識中心

目前所有數據皆為示範資料，尚未連接即時氣象、衛星、空域、民航、農業資料、API、AI、登入、後台或資料庫。

## 本機開啟

直接以瀏覽器開啟 `index.html` 即可。亦可使用靜態伺服器預覽：

```bash
python3 -m http.server 8000
```

再開啟 `http://localhost:8000/`。

## 專案結構

```text
assets/       圖片、圖示與 Logo 素材
data/         未來的天氣、法規、無人機與任務資料
pages/        未來頁面預留目錄
index.html    首頁
style.css     全站樣式
script.js     首頁互動
robots.txt    搜尋引擎規則
sitemap.xml   網站地圖
```

## 發布提醒

`sitemap.xml` 目前採用預定 GitHub Pages 網址。若 Repository 擁有者或正式網域不同，發布前應同步修改其中網址。
