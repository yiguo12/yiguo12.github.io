# 把新版產品介面放進 Figma

這是本次新版 Bot 的代表情境，共 32 個固定畫面。畫面內只有實際產品操作，不顯示使用者流程圖或展示控制；User Flow 是畫布下方的獨立設計參考。

HTML 提供動態輸入與編輯；此匯入包使用固定畫面與點擊連結，不能在 Figma 原型內任意輸入文字。

1. 用 Figma 桌面版開啟 Design 檔，選 Plugins → Development → New plugin。
2. 選 Figma Design、只執行一次的模式，儲存到空資料夾。Figma 會生成 manifest.json 與專屬 ID。
3. 以本套件的 code.js 替換剛才資料夾中的同名檔。保留 Figma 生成的 manifest.json 與 ID，確認 main 為 code.js。
4. 執行這個本地 plugin，會新增一頁，不覆蓋既有畫布。
5. 選 00 群組畫面後按 Present。

manifest.template.json 為設定參考，沒有註冊 ID，不應直接當成已註冊的 plugin 匯入。

本套件不連線、不讀取聊天。文字與向量會建立成 Figma 節點，字型可能略有差異。已檢查語法與連結目標，尚未在真實 Figma 內執行驗證。

官方說明：https://developers.figma.com/docs/plugins/manifest/

本次已補入整理成果、原始來源、補充不確定地點與偏好畫面。HTML 的搜尋、分類與補充可動態操作；Figma 匯入包採固定代表情境。

本次讀取範圍改為直接點選，固定場景會直接顯示對話內的成果視窗；HTML 另含整理中狀態、完成後自動展開與中途取消處理。原對話、輸入框與結果卡片持續保留。
