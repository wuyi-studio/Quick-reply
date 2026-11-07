// 梧藝客服小幫手（由 quick-reply/index.html 移植，原有功能保留）
    const TOTAL_PAGES = 10;
    const SLOTS_PER_PAGE = 10;
    let currentPage = 1;
    let modalPage = 1;
    let currentCategory = 'all';

    const legacyCategoryMap = {
      payment: '💙',
      cake: '🎂',
      pickup: '🚗',
      delivery: '🚗',
      flower: '💐',
      addon: '‼️'
    };

    // 官方預設常用回覆（梧藝 2026-11-06 版，共 45 則，依序排入第 1～5 頁，每頁 10 格）
    const defaultPage1Replies = [
      {
        "id": "slot_1_0",
        "category": "🍔",
        "title": "現貨漢堡盒",
        "text": "您好 ～\n這是今天的「現貨漢堡盒」款式，給您參考看看唷！\n\n如有喜歡的款式，\n請先直接回覆告訴我們「想預留哪一款」\n\n我們幫您確認還有沒有現貨後，\n會再傳送專屬預留表單給您填寫喔\n\n-------------------\n✔️現場取貨時再麻煩告訴我們\n\n❶要取『現貨蛋糕』\n❷名字\n❸電話後三碼\n\n我們會跟您核對唷！ 謝謝您🫶🏻"
      },
      {
        "id": "slot_1_1",
        "category": "⭐️",
        "title": "=公 版=",
        "text": "您好 \n這週客製蛋糕已經滿單囉～\n\n目前有的選擇是\n▪️當日現貨漢堡盒\n▪️公版整模蛋糕\n\n請問想諮詢哪一種呢？☺️"
      },
      {
        "id": "slot_1_2",
        "category": "⭐️",
        "title": "填資料 😡💢 1️⃣",
        "text": "您好～\n\n目前那天還有檔期喔💖\n\n\n報價的判斷依據為 蛋糕尺寸、口味及客製需求喔\n\n為了提供您準確的報價\n麻煩協助填寫諮詢表單的每項資訊，謝謝您的配合\n\n\n\n▫️若開頭詢問我們的『取貨檔期』\n      與下方填寫的『取貨日期不同』\n請先告知我們，我們再次幫您確認檔期喔！\n\n\n────────────\n\n\n▫️客製需求小提醒\n\n▪️請將所有客製需求一次整理告知。\n▪️可以跟圖片同款，或是更改蛋糕顏色、\n     有題字的地方可以更改題字內容、\n     任何客製要求或是修改的小細節等\n▪️報價後新增客製需求或是更改口味，\n      會將依項目重新報價，視情況額外收費唷\n▪️若更動任何訂購資訊，麻煩「重新填寫」回傳，\n      並且告訴我們更改的地方， \n      以免日後訂單的資料有誤喔！\n\n\n────────────\n\n為了能更快協助您，請先填寫「諮詢表單」\n\n     🔺我們會提供：\n    ❶諮詢表單\n    ❷請您填寫資訊\n    ❸收到後我們會報價給您\n\n     🔺您收到報價後：\n    ❶諮詢不代表保留檔期或必須要購買\n    ❷請告知我們需不需要訂購\n    ❸若確定要訂購，我們提供轉帳資訊\n    ❹期限內匯款完成 就是訂購成功喔\n\n\n感謝您的配合 ✨"
      },
      {
        "id": "slot_1_3",
        "category": "💐",
        "title": "問花💐給他連結",
        "text": "您好～\n我們的鮮花\n\n簡約款透明包裝 $390起～\n精緻包裝花束 $1280起～ \n\n可以參考方案後，截圖喜歡的款式與我們討論喔\n\n\n\n📌 更多方案介紹可以參考連結：\nhttps://forms.gle/fM4fT5JC6yQhPWAg6"
      },
      {
        "id": "flower_care",
        "category": "💐",
        "catName": "💐 花藝照護",
        "tagClass": "tag-blue",
        "title": "鮮花花束保水與照護說明",
        "text": "【花束照護小提醒】\n花束底部均附有保水花泥/水袋，建議取貨當天拆除包裝後將花莖剪斜角插水瓶，每日換水並放置於陰涼通風處，避免陽光直曬或冷氣出風口直吹喔！"
      },
      {
        "id": "slot_1_5",
        "category": "💐",
        "title": "買花💐-💰付款帳號💰",
        "text": "匯款資訊：\n\n戶名：梧藝工作室\n銀行：連線商業銀行（824）\n匯款帳號：312000009259\n\n\n••┈┈┈┈┈┈┈┈••\n\n▪️ 匯款提醒\n請於詢問當天完成匯款並提供帳號後五碼\n否則訂單將不成立，也不會安排製作喔！\n\n\n••┈┈┈┈┈┈┈┈••\n\n▫️下單前請留意\n\n▪️ 匯款前請確認總金額是否正確\n\n▪️ 如需加購提袋 $40 或襯紙 $100，請提前備註\n\n▪️ 匯款完成後恕『無法取消訂單』，\n     因為鮮花有保鮮期問題，請確認需求後再下單！ \n\n▪️ 付款後若想改期，請在取貨前8天提出更改取貨日，\n     須在取貨日前8天提出，可更改一次日期。\n\n▪️ 付款後若想改期，在取貨8天內提出更改取貨日，\n     因為鮮花有保鮮期問題需因為改期重新叫貨，\n     改期訂單則收總金額50%。\n\n\n••┈┈┈┈┈┈┈┈••\n\n▫️ 花束設計與花材說明\n\n▪️ 透明包裝花束為簡易透明玻璃紙包裝，不含提袋\n\n▪️ 精緻花束則包含提袋\n\n▪️ 所有花束皆由闆娘設計，恕『不指定』花材及指定樣式\n\n▪️ 花束圖片僅供風格參考\n     每束花都是獨一無二的作品\n     無法與圖片完全相同。\n\n▪️ 花材具有季節性，價格會依訂購時的市場行情浮動。\n\n▪️ 若遇花材缺貨或季節性供應問題，\n     將以同等性質或相近色系的花材替代。\n\n▪️ 鮮花花束沒有固定的長、寬、高尺寸標準，\n    會依預算與花材搭配呈現。\n\n▪️ 下單前請先參考並確認能接受梧藝IG上的花藝風格\n     若對花材、款式或成品有較高的指定需求\n     建議先與我們討論再決定是否訂購喔～🫶🏻\n\n\n▫️鮮花照顧提醒\n\n▪️ 建議將鮮花放置於涼爽的冷氣房，避免冷氣出風口直吹\n\n▪️ 請避免將鮮花放在密閉、高溫或陽光直射的環境，\n     以免水分流失、影響花況\n\n▪️ 花草植物具有自然生長的痕跡，花瓣、枝葉及形態\n     可能存在些微差異，無法保證每一處都完美無瑕，\n     還請理解與包容 \n\n••┈┈┈┈┈┈┈┈••\n\n📍 取貨地點\n\n台南市中西區友愛街 93 號 （14:30～19:00）"
      },
      {
        "id": "slot_1_6",
        "category": "💐",
        "title": "買透包💐--填寫",
        "text": "💐透明包裝花束💐\n\n(圖片僅供參考)\n\n鮮花色系：\n($390~$1300)鮮花預算：\n加購$100-襯紙：\n加購$40--提袋：\n\n取貨日期：\n取貨時間(14:30-19:00)：\n取貨地點：台南市中西區友愛街93號 \n\n訂購人的LINE名稱：\n取貨人姓名：\n取貨人電話：\n\n\n\n🔺請確認以上每項資訊都有填寫喔\n\n\n------------------\n\n▫️訂購前小提醒\n\n▪️ 鮮花具有季節性，價格依訂購日時價調整。\n▪️ 花束皆由闆娘依預算及色系搭配，\n     恕不指定花材及固定款式。\n▪️ 圖片僅供風格參考，\n     每束花都是獨一無二的作品，\n     無法與圖片完全相同。\n▪️ 下單前請先確認能接受 \n     WUYI IG 上的花藝風格喔"
      },
      {
        "id": "slot_1_7",
        "category": "💐",
        "title": "買精緻💐-填寫",
        "text": "您好 \n幫您登記參考當日『現貨漢堡盒蛋糕 』\n\n當天中午蛋糕製作完成後\n會於 12:30～13:30 之間傳送圖片給您參考\n記得留意訊息喔！🫶🏻\n\n\n訂購流程：\n❶選款⭢❷我們會報價⭢❸完成匯款⭢❹預留3~7點至門市取\n⚠️只能立即匯款預留，無法到店再付款呦！\n\n\n\n💌 若當天訊息量較大，尚未回覆到您，可以到ig限動截圖並傳給我們報價，我們會依序盡快回覆，謝謝您 💗"
      },
      {
        "id": "slot_1_8",
        "category": "🍔",
        "title": "買現貨🍔💰付款帳號💰",
        "text": "匯款資訊：\n\n戶名：梧藝工作室\n銀行：連線商業銀行（824）\n匯款帳號：312000009259\n\n\n\n轉帳完成後，請提供以下資訊：\n\n\n1️⃣ 轉帳金額：\n2️⃣ 轉帳後五碼：\n3️⃣ 訂購人姓名：\n4️⃣ 訂購人電話：\n5️⃣ 預計取貨時間：\n6️⃣ 加購項目：\n\n取貨地址：台南市中西區友愛街93號（14:30-19:00）\n\n\n•┈┈┈┈┈┈┈•\n\n✔️現場取貨時再麻煩告訴我們\n\n❶要取『現貨蛋糕』\n❷名字\n❸電話後三碼\n\n我們會跟您核對唷！ 謝謝您🫶🏻"
      },
      {
        "id": "slot_1_9",
        "category": "🍔",
        "title": "現貨 🍔登記完成🍔",
        "text": "您好 \n幫您登記參考當日『現貨漢堡盒蛋糕 』\n\n當天中午蛋糕製作完成後\n會於 12:30～13:30 之間傳送圖片給您參考\n記得留意訊息喔！🫶🏻\n\n\n訂購流程：\n❶選款⭢❷我們會報價⭢❸完成匯款⭢❹預留3~7點至門市取\n⚠️只能立即匯款預留，無法到店再付款呦！\n\n\n\n💌 若當天訊息量較大，尚未回覆到您，可以到ig限動截圖並傳給我們報價，我們會依序盡快回覆，謝謝您 💗"
      },
      {
        "id": "slot_2_0",
        "category": "🍔",
        "title": "現貨 🍔問一點Ig🍔",
        "text": "您好\n\n大約下午1點左右會在IG限動po當日現貨漢堡盒蛋糕的圖片呦！\n\n若您有確定需要參考當天現貨的話可以告訴我們\n✍🏻預先幫您登記，當天完成後傳圖片給您參考喔～\n\n\n▪️關於現貨漢堡盒\n\n*現貨漢堡盒 $700起～\n*中西區的門店現貨漢堡盒在營業日，1-2pm區間會發限動\n*現貨漢堡盒的樣式＋口味，當天發佈（沒 有 照 片 可 以 提 前 挑 選）\n*現貨無法提前一天以上保留，有需要訂購現貨可以當天詢問或是營業時間到門店挑選喔！\n\n\n▪️門店地址：台南市中西區友愛街93號 （⏰ 3𝐩𝐦 - 7𝐩𝐦）\n\n\n\n\n🍔 漢堡盒蛋糕介紹\n\n▪️ 尺寸：4 吋，單層夾餡\n     適合 1～2 人食用。\n▪️ 包裝盒尺寸：15 × 15 × 8 cm\n▪️ 附一支隨機蠟燭\n▪️ 附紙袋，但沒有提供保冷袋＆保冷劑喔\n     可自備或加購（保冷袋＆保冷劑 $100）\n▪️ 響應環保，不附餐具喔\n     2 人份盤叉刀加購 $15，5人份$30\n▪️ 造型蠟燭可以現場選購\n\n\n\n🍰 保存與裝飾提醒\n\n▪️ 蛋糕使用動物性鮮奶油\n     不添加防腐劑及香精\n     建議取貨當天食用，最晚不超過 2 天。\n▪️ 回家後建議先冷藏至少 30 分鐘再食用，口感更佳。\n▪️ 動物性鮮奶油較容易受溫度影響，\n     請盡快冷藏並避免高溫。\n▪️ 調色奶油及有色糖珠可能會有暈色、染色情況，屬正常現象。\n▪️ 蛋糕底部有墊油紙，邊緣些微沾蹭屬正常製作現象。\n▪️ 裝飾用的小花、小葉等非食用素材請勿食用；\n     若介意者，請斟酌後再下單喔！\n\n\n謝謝您🫶🏻💗"
      },
      {
        "id": "slot_2_1",
        "category": "⭐️",
        "title": "稍後 查帳💰",
        "text": "您好～\n\n會計待查帳確認後，我們會盡快回覆您。\n\n再麻煩您耐心等候，謝謝您的理解與配合 🫶🏻"
      },
      {
        "id": "slot_2_2",
        "category": "⭐️",
        "title": "轉帳 收到錢💰",
        "text": "收到囉～謝謝您 🫶🏻\n\n\n麻煩先幫我們確認以下資訊是否正確喔~\n\n❶取貨日期：\n❷匯款金額收到：$\n\n\n\n⚠️ 關於取貨日期與時間異動：\n▪️ 取貨前 7 天內，恕無法更改日期及時間。\n▪️ 若需更改，請於取貨前 7 天以上提前詢問，\n    我們會再確認是否能協助調整。"
      },
      {
        "id": "slot_2_3",
        "category": "⭐️",
        "title": "🍰🍰🍰 蛋 糕 報 價🍰🍰🍰",
        "text": "此蛋糕報價為取貨日：\n\n尺吋：\n加上樣式 & 口味\n\n蛋糕價格是$ \n\n(此報價不含餐具、塑膠或木頭插牌、\n造型蠟燭、花束、保冰袋劑...等)\n\n\n\n⚠️若您自選的款式蛋糕上有裝飾品/鮮花類\n我們皆會消毒清洗後擺上\n若是無法認同接受且完美主義者\n請勿下單購買，謝謝您🙏🏻\n\n\n\n💌 訂購流程\n\n報價不代表保留您的諮詢檔期\n\n無論是否訂購\n都麻煩您回覆告知我們一聲\n讓我們知道唷\n\n\n\n💌 確認訂購\n\n若確認要訂購，請告知我們\n我們會提供銀行帳號\n請於兩天內（含詢問當日）完成轉帳\n轉帳成功後才算訂購完成喔\n逾期則不保留名額 再請留意時間喔\n\n謝謝您的理解與配合 🌷\n\n\n\n//\n🔸 蛋糕附贈一隻不挑款蠟燭🔸\n\n可另外加購：\n▫️刀叉盤組：2人餐具（$15），5人餐具（$30）\n▫️保冷劑＋保冷袋(27*27*27cm) 一組$100\n▫️數字蠟燭一根 $30\n▫️多款造型蠟燭＆生日快樂插牌\n\n//\n客製漢堡盒（包裝盒15*15*8cm）\n4寸（包裝盒17*17*20cm）\n6寸（包裝盒22*22*24cm）\n8寸（包裝盒26*26*24cm）\n\n//\n蛋糕皆手工製作，每顆蛋糕都是獨一無二，\n蛋糕顏色跟造型多少都會跟原圖有落差，\n絕對不會跟圖片100%一模一樣，\n調色奶油有添加色素，色素容易暈染是正常現象，\n若是完美主義者/對我們的風格不信任且質疑等，請勿下單喔\n\n//\n關於題字，\n手寫字無法跟電腦字體一樣完美，\n在蛋糕上也不會完全對齊且致中，\n每個人手寫文字字跡各有風格，\n完美主義者or要求字跡工整致中者\n請勿下單喔！\n\n\n// 關於蛋糕保存\n蛋糕為動物鮮奶油蛋糕，離開冰箱15分鐘會開始融化造成蛋糕倒塌傾斜等，\n建議取貨要準備『保冰袋＋保冰劑』 \n\n//\n蛋糕取貨三天內食用口感比較好喔，冷藏即可！\n若裝飾有餅乾水果等，會因為冷藏變軟,氧化是正常現象\n\n//\n若您選的口味夾餡有當季水果，則水果為隨機出，無法指定；\n另外若蛋糕外觀款式為水果裝飾蛋糕，\n水果會依當月有供應的水果去採買，水果有季節性，\n裝飾水果會隨機出，有水果過敏的可以事先告知喔！\n\n//\n若您選的款式為鮮花蛋糕，鮮花會依當天市場有的花材去採買無法指定(花有季節性)\n可以告訴我喜歡的色系，我會幫忙搭配，盡量與圖片同款唷！\n若是完美主義者或需與圖片一模一樣的，介意蛋糕有鮮花者，請勿下單喔！"
      },
      {
        "id": "slot_2_4",
        "category": "🍔",
        "title": "🍔🍔 現貨--報價 🍔🍔",
        "text": "漢堡盒$\n2人餐具含刀叉盤$15 （有需要可加購喔）\n\n\n•┈┈┈┈┈┈┈•\n\n\n當日現貨詢問的款式會「保留15分鐘」\n有需要預留請及時回覆告知 \n我們傳帳號給您呦！\n轉帳完成才算預留成功~\n\n\n預留成功後無法因任何因素取消及退款\n限當日於營業時間下午3~7點內領取蛋糕\n請務必確認好有需要蛋糕再預留呦！\n\n\n⚠️若您自選的款式蛋糕上有裝飾品/鮮花，我們皆會消毒清洗後擺上，\n若是無法認同接受且完美主義者，請勿下單購買，謝謝🙏🏻\n\n⚠️ 當天領取請跟我們『當面核對點交』訂購商品及加購商品是否拿齊全！\n\n\n•┈┈┈┈┈┈┈•\n\n\n✔️關於漢堡盒蛋糕\n\n▪️ 尺寸為 4 吋、單層夾餡\n    盒子尺寸 15 × 15 × 8 cm\n    約適合 1～2 人\n\n▪️ 附手提紙袋及一支隨機蠟燭，不附餐具。\n\n▪️ 可加購 2 人份餐具組（盤、叉、刀）$15\n    門市另有造型蠟燭、生日插牌及慶生道具可選購\n\n▪️ 建議自備保冷袋及保冷劑\n     現場可加購 $100\n\n▪️ 蛋糕使用動物性鮮奶油\n    不添加防腐劑及香精\n    建議取貨當天食用\n    最晚不超過 2 天。\n    食用前先冷藏 30 分鐘，口感更佳。\n\n▪️ 調色奶油及有色糖珠\n    可能出現暈色，屬正常現象\n\n▪️ 蛋糕底部有墊油紙\n     邊緣些微沾蹭屬正常製作現象\n\n\n📍 門市地址：台南市中西區友愛街93號 (15:00～19:00)"
      },
      {
        "id": "slot_2_5",
        "category": "🍔",
        "title": "🍔🍔 客製--報價 🍔🍔",
        "text": "此漢堡盒蛋糕報價為取貨日：\n\n漢堡盒$\n兩人餐具盤子刀子叉子$15 （依需求加購即可）\n\n\n\n⚠️ 以上報價不含餐具、造型蠟燭、\n   生日插牌、花束、保冷袋劑及配送費等。\n\n\n⚠️若您自選的款式蛋糕上有裝飾品/鮮花類\n我們皆會消毒清洗後擺上\n若是無法認同接受且完美主義者\n請勿下單購買，謝謝您🙏🏻\n\n\n---------\n\n💌 訂購流程\n\n報價不代表保留您的諮詢檔期\n\n無論是否訂購\n都麻煩您回覆告知我們一聲\n讓我們知道唷～\n\n\n\n💌 確認訂購\n\n若確認要訂購，請告知我們\n我們會提供銀行帳號\n請於兩天內（含詢問當日）完成轉帳\n轉帳成功後才算訂購完成喔\n逾期則不保留名額 再請留意時間喔～\n\n謝謝您的理解與配合 🌷\n\n\n\n---------\n\n\n✔️漢堡盒蛋糕介紹\n\n▪️ 尺寸為 4 吋、單層夾餡\n    盒子尺寸 15 × 15 × 8 cm\n    約適合 1～2 人\n\n▪️ 附手提紙袋及一支隨機蠟燭，不附餐具。\n\n▪️ 可加購 2 人份餐具組（盤、叉、刀）$15\n    門市另有造型蠟燭、生日插牌及慶生道具可選購\n\n▪️ 建議自備保冷袋及保冷劑\n     現場也能加購是一組 $100\n\n▪️ 蛋糕使用動物性鮮奶油\n    不添加防腐劑及香精\n    建議取貨當天食用\n    最晚不超過 2 天。\n    食用前先冷藏 30 分鐘，口感更佳。\n\n▪️ 調色奶油及有色糖珠\n    可能出現暈色，屬正常現象\n\n▪️ 蛋糕底部有墊油紙\n     邊緣些微沾蹭屬正常製作現象\n\n▪️關於題字，\n    手寫字無法跟電腦字體一樣完美，\n    在蛋糕上也不會完全對齊且致中，\n    每個人手寫文字字跡各有風格，\n    完美主義者or要求字跡工整致中者\n    請勿下單喔！\n\n\n📍 門市地址：台南市中西區友愛街93號 （15:00～19:00）\n\n\n\n謝謝您🫶🏻"
      },
      {
        "id": "slot_2_6",
        "category": "❤️",
        "title": "❤️富邦銀行",
        "text": "您好～匯款前\n請 『仔細』確認上方\n跟您核對的資訊對不對喔~\n\n❶取貨日期\n❷客製需求(蛋糕顏色,題字內容...等)\n❸訂單資訊\n❹金額統計\n\n\n••┈┈┈┈┈┈┈┈•• \n\n\n取貨日期：\n\n\n戶名：梧藝工作室\n銀行：連線商業銀行（824）\n匯款帳號：312000009259\n\n\n\n••┈┈┈┈┈┈┈┈•• \n\n\n謝謝您的諮詢與訂購 ❤️\n\n\n✔️匯款注意事項\n\n▪️ 請於兩日內完成匯款\n    並主動告知轉帳後五碼\n    才算訂購成功；逾期未完成\n    訂單將不成立，也不會安排製作喔！\n\n▪️ 轉帳時請勿備註內容\n     我們會看不到您的轉帳後五碼 \n    而無法核對您的紀錄喔\n\n▪️ 匯款前請再次確認總金額\n    並確認餐具、造型蠟燭、生日插牌、\n    保冷袋及保冷劑等加購品項皆已計入\n\n▪️ 若訂購人與取貨人不同，\n    請提前告知，以利取貨時核對資訊。\n\n\n▪️ 自取時間內都可以與地點固定\n    恕不另約時間面交\n    取貨當日恕不接受任何更改喔～\n\n▪️ 取貨時請與我們當面核對\n    購買的蛋糕及所有加購商品\n    確認品項皆已拿齊在離開喔\n\n\n📍 取貨資訊\n地址：台南市中西區友愛街 93 號\n時間：下午 3:00～7:00\n\n\n\n📌 下單前請詳閱購買規則\nhttps://forms.gle/pWgKY8vMWvckDjFV6\n\n\n\n謝謝您 🫶🏻"
      },
      {
        "id": "slot_2_7",
        "category": "💙",
        "title": "💙LINE Bank",
        "text": "您好～匯款前\n請 『仔細』確認上方\n跟您核對的資訊對不對喔~\n\n❶取貨日期\n❷客製需求(蛋糕顏色,題字內容...等)\n❸訂單資訊\n❹金額統計\n\n\n••┈┈┈┈┈┈┈┈•• \n\n\n取貨日期：\n\n\n銀行代號：824  (連線商業銀行)\n存簿帳號：111018063578\n\n\n••┈┈┈┈┈┈┈┈•• \n\n\n謝謝您的諮詢與訂購 💙\n\n\n✔️匯款注意事項\n\n▪️ 請於兩日內完成匯款\n    並主動告知轉帳後五碼\n    才算訂購成功；逾期未完成\n    訂單將不成立，也不會安排製作喔！\n\n▪️ 轉帳時請勿備註內容\n     我們會看不到您的轉帳後五碼 \n    而無法核對您的紀錄喔\n\n▪️ 匯款前請再次確認總金額\n    並確認餐具、造型蠟燭、生日插牌、\n    保冷袋及保冷劑等加購品項皆已計入\n\n▪️ 若訂購人與取貨人不同，\n    請提前告知，以利取貨時核對資訊。\n\n\n▪️ 自取時間內都可以與地點固定\n    恕不另約時間面交\n    取貨當日恕不接受任何更改喔～\n\n▪️ 取貨時請與我們當面核對\n    購買的蛋糕及所有加購商品\n    確認品項皆已拿齊在離開喔\n\n\n📍 取貨資訊\n地址：台南市中西區友愛街 93 號\n時間：下午 3:00～7:00\n\n\n\n📌 下單前請詳閱購買規則\nhttps://forms.gle/pWgKY8vMWvckDjFV6\n\n\n\n謝謝您 🫶🏻"
      },
      {
        "id": "slot_2_8",
        "category": "😊",
        "title": "到底要不要😌",
        "text": "📌 諮詢檔期保留兩天～不管需不需要訂購，都再麻煩告知我們喔 \n \n\n需要訂購，請告訴我們喔！\n\n幫您統計金額並傳匯款帳號給您\n\n2日內確認入帳後才算訂購成功哦，謝謝✨"
      },
      {
        "id": "slot_2_9",
        "category": "😊",
        "title": "只有花 取貨訂單💐☑️",
        "text": "您好 ，\n這是您 取 貨 出 示 的 『 訂 單 』建議先 截圖保存喔\n\n麻煩確認後 回覆我們以上訂單 『正確』 或是 『不正確 需修改』謝謝您～\n\n\n🛍️ 加購商品確認\n▪️ 請確認加購項目及內容都有正確標示。\n▪️ 花束加購：提袋 $40、襯紙 $100 等。\n▪️ 卡片代寫 $30，請確認文字內容正確。（情人節、畢業季、母親節等節日恕不適用）\n\n\n⭐️當天完成後「無法重做」或是「修改樣式」喔！\n⭐️取貨時請出示訂單截圖，以便核對資訊\n⭐️請當面確認花束及加購商品是否齊全，確認後再離開喔 \n⭐️取貨地址：台南市中西區友愛街93號\n\n\n謝謝您的配合與理解 🫶🏻💗"
      },
      {
        "id": "slot_3_0",
        "category": "😊",
        "title": "不可食用",
        "text": "蛋糕上的裝飾品及鮮花必須在食用前取下喔\n裝飾品及鮮花皆為不可食用喔\n\n請問可以接受嗎？🫶🏻"
      },
      {
        "id": "slot_3_1",
        "category": "😊",
        "title": "買花 一直問價錢🤬",
        "text": "您好～\n\n鮮花屬於時價商品\n因此不建議直接以過往作品圖片\n的花量或款式來比較價格喔～\n\n▪️ 鮮花價格會受到天氣、季節及節慶等因素影響\n    每週價格都可能有所浮動，花材也會因季節而有所不同\n    圖片中的花材不一定當季都有供應\n\n▪️ 透明包裝花束 $390 起\n     約 5～7 支花材，\n     會依當週花市價格及實際花材搭配定價\n\n▪️  透明包裝花束恕無法指定花材\n     但可以許願喜歡的花材\n     我們會依當季供應情況盡可能為您安排\n\n▪️ 建議您可以告訴我們 『預算＋色系』\n     我們為您搭配＆設計適合的花束喔\n\n謝謝您的理解與支持 🫶🏻💗"
      },
      {
        "id": "slot_3_2",
        "category": "😊",
        "title": "還沒開放訂購🗓️",
        "text": "您好～\n\n不好意思，目前尚未開放 ❓月份的訂購喔！\n\n建議您可以於 ❓月初留意我們的 IG 公告\n開放預訂後，再私訊我們諮詢喔～\n\n屆時我們會統一確認檔期、回覆及報價 \n\n謝謝您的🫶🏻💗"
      },
      {
        "id": "slot_3_3",
        "category": "🎂",
        "title": "問當季水果🍓🍇🫐🥭",
        "text": "您好\n\n若您選擇的口味夾餡或裝飾含有當季水果\n將依當月廠商供應的水果情況隨機搭配\n恕無法指定喔～💗\n\n▪️水果會受到季節及市場供應影響\n我們會依當月實際供應的水果進行採買與搭配\n\n▪️若有水果過敏，請務必提前告知\n我們會盡可能為您避開\n\n▪️若對水果種類有特定要求或疑慮\n也建議您選擇其他夾餡口味替代喔！\n\n謝謝您的理解與配合 🫶🏻✨"
      },
      {
        "id": "slot_3_4",
        "category": "😊",
        "title": "週六，問客人要不要，催🐤",
        "text": "您好～\n\n溫馨提醒\n我們會於  ❓  統計當天客製訂單數量並進行結單。\n\n如果有需要訂購或諮詢，歡迎在這個時間前告訴我們 \n方便我們統計＆配料相關訂單喔～\n\n\n▪️若超過結單時間沒有回覆，當日檔期將無法再為您保留，還請見諒 ，謝謝🙏🏻"
      },
      {
        "id": "slot_3_5",
        "category": "❓",
        "title": "Nikki回覆 放❓❓",
        "text": "您好呀～\n\n不好意思\n目前工作人員正在忙碌中\n我們會先與同事確認相關資訊\n確認後再盡快回覆您喔～💗\n\n謝謝您的耐心等候與體諒 🫶🏻✨"
      },
      {
        "id": "slot_3_6",
        "category": "🎂",
        "title": "蛋糕做好囉👌🆗給照片",
        "text": "您好 蛋糕完成囉～\n\n    WUYI 蛋糕取貨請出示\n    之前傳給您的『訂 單 資 訊』截圖，以便核對喔\n\n\n▫️ 取貨地址：台南市中西區友愛街93號\n▫️取貨時間：15:00～19:00\n\n\n\n▪️ 若訂購人與取貨人不同，請提前告知也麻煩取貨人出示訂單資訊截圖\n▪️ 取貨時請確認蛋糕及加購商品皆已拿齊\n▪️ 加購商品若有問題，請於取貨當日立即告知，隔日恕無法受理\n▪️ 請在時間內取貨，逾時恕不等候，若無法前來，請提前安排親友或跑腿代領喔\n\n\n────────────\n\n\n🥵 動物性鮮奶油蛋糕在室溫\n     約 10～15 分鐘就可能開始融化，\n     導致蛋糕傾斜、倒塌或裝飾移位，記得趕緊冷藏\n\n▪️ 強烈建議蛋糕需要有裝在『保冰袋並且有足量保冷劑』\n    只有袋子沒有保冷劑一樣是會融化喔\n▪️ 保冰袋搭配保冷劑約可維持，30～40 分鐘，實際保冰效果依天氣及環境而異\n▪️ 回家後請立即將蛋糕從袋子取出， 放入冰箱冷藏\n▪️ 臨時加購保冰袋及保冷劑，可以當天面交時告知喔，加購是$100\n\n🚗 建議開車平放運送；\n     機車取貨建議雙載由後座提拿。\n     跑腿配送建議選擇汽車。\n\n\n🎁 包裝盒尺寸\n\n▪️ 客製漢堡盒：15 × 15 × 8 cm\n▪️ 4 吋：17 × 17 × 20 cm\n▪️ 6 吋：22 × 22 × 24 cm\n▪️ 8 吋：26 × 26 × 24 cm\n\n🕯️ 蛋糕附一支蠟燭，不附餐具及保冰袋，\n     需另行準備或加購。\n\n\n🍰 保存提醒\n     蛋糕為當天現做，建議兩天內食用。\n     取貨後先冷藏至少 30 分鐘，\n     食用前再取出，口感更佳。\n\n\n謝謝您 🫶🏻💗"
      },
      {
        "id": "slot_3_7",
        "category": "💐",
        "title": "花束做好囉👌🆗給照片",
        "text": "您好，這是您的花束 💐🤍\n以下是花束照護小提醒，請您參考～\n\n\n🌷 鮮花照護\n\n▫️ 鮮花較脆弱，請避免風吹、日曬及雨淋，\n     取貨時請先確認花況再離開喔！\n\n▫️ 建議開車取貨；若騎機車，\n     請將花束放入提袋並放置於腳踏板，\n     避免放入車廂或受到強風吹襲。\n\n▫️ 鮮花平均觀賞期約 3～7 天，\n     回家後可拆除包裝，放入乾淨花器中。\n\n▫️ 每 1～2 天換水一次，\n     並將花腳斜剪一小段，\n     幫助花朵吸水。\n\n▫️ 建議放置於涼爽的冷氣房，\n     避免陽光直曬、高溫環境及冷氣出風口直吹。\n\n▫️ 鮮花若因高溫或曝曬而失水、影響花況，\n     屬於自然現象。\n\n▫️ 花草皆有自然生長的痕跡，\n    每朵花的姿態與狀態都不同，\n    無法保證完美無瑕，謝謝您的理解 🤍\n\n\n\n🌹 永生花照護\n\n▫️ 請放置於乾燥陰涼處，\n     避免陽光直曬及潮濕環境。\n\n▫️ 妥善保存約可觀賞 1～3 年，\n     隨時間褪色或風化皆屬自然現象。\n\n▫️ 若花朵沾附灰塵，可使用小刷具輕刷，\n     或以吹風機的弱風吹除。"
      },
      {
        "id": "slot_3_8",
        "category": "🎂",
        "title": "蛋糕 取貨訂單🎂☑️",
        "text": "您好 ，\n這是您 取 貨 出 示 的 『 訂 單 』建議先 截圖保存喔\n\n麻煩確認後 回覆我們以上訂單 『正確』 或是 『不正確 需修改』謝謝您～\n\n\n\n⭐️當天完成後「無法重做」或是「修改樣式」喔！\n\n⭐️若一開始沒有告知題字內容\n   訂單溝通且完成後才告知要加字\n（會視情況拒絕&額外收費喔）\n\n⭐️訂單有「特殊要求」或「客製的細節部分」\n   請確認訂單內容 是 否 標  註  正 確\n   當天會按照這訂單內容去製作\n\n\n🔺麻煩務必檢查🔺\n\n您的 「任 何 客 製  要 求」溝通的最終版本\n有完整且明確表達在訂單上面\n若是有『題字』請再三檢查確認喔～\n\n---\n\n▪️\n請確認自行加購的商品標示清楚\n當天領取請跟我們當面核對點交是否拿齊全\n比如購買蛋糕(餐具 造型蠟燭 生日插牌 保冰袋劑 等)\n比如購買花束(提袋 襯紙等)\n\n⚠️取貨需提供上方的「訂單截圖」\n   以方便核對是否資訊正確才領取唷！\n\n⚠️取貨日當天，請『當面跟我們點清』\n   加購物品是不是有齊全再領走唷！\n\n▪️蛋糕製作時段為當日上午，\n     期間無法即時回覆訊息，敬請見諒\n\n▪️動物鮮奶油蛋糕比較脆弱，\n    建議「開車取蛋糕並放在平坦的腳踏上會更安全」\n    或是「機車雙載由後座提拿」，\n    若是由跑腿取貨建議選擇『汽車』方式喔！\n\n▪️若是訂購人與取貨人不同，\n    請事先告知，以免領取無法核對資訊，\n    也務必將訂單截圖資訊發給取貨人跟我們核對\n\n▪️自取當天請在您約定的時間前來取貨，\n    當天嚴重大大遲到不取貨，我們則不等候，\n    需請您找家人朋友or付費找跑腿取走蛋糕，\n    打烊後門店不保留代保管冷藏蛋糕\n\n🥵🫠動物鮮奶油蛋糕在室溫下10-15分鐘\n        就會融化容易導致蛋糕倒塌、傾斜\n        加上運輸更有移位等問題\n        有保冰袋＋保冰劑可以維持30-40分鐘\n\n🥵🫠務必務必取貨當天\n        要將蛋糕放置在冰箱裡面\n        才有「保冷的狀態下」才能有完美的蛋糕喔 \n        蛋糕冷藏即可，並在1-3天內食用口感最佳。\n\n📦\n漢堡盒（包裝盒15*15*8cm）\n4寸（包裝盒17*17*20cm）\n6寸（包裝盒22*22*24cm）\n8寸（包裝盒26*26*24cm）\n\n感謝您🫶🏻"
      },
      {
        "id": "slot_3_9",
        "category": "😊",
        "title": "新店面－友愛街",
        "text": "🥳 WUYI 搬新家囉！✨\n\n提醒您，取貨地點已更換，記得不要跑錯地方囉\n\n\n📍 新店面地址\n台南市中西區友愛街93號\n\n⏰ 取貨時間\n15:00～19:00\n\n\n\n有空也歡迎來找我們玩！🌷\n期待與您見面 (๑>◡<๑) 🫶🏻"
      },
      {
        "id": "slot_4_0",
        "category": "😊",
        "title": "我要下班了！",
        "text": "您好～\n我們今天『取貨時間到晚上7點』\n提醒您要記得前來取走您訂購的商品呦\n\n謝謝您🫶🏻"
      },
      {
        "id": "slot_4_1",
        "category": "❓",
        "title": "蛋糕 放多久吃",
        "text": "蛋糕保存與食用提醒 \n\n▪️ 蛋糕皆為新鮮製作\n     不添加防腐劑及香精\n    建議於取貨日起 1～3 天內食用\n    奶油口感最佳喔！\n\n▪️ 奶油調色提醒\n     調色奶油可能出現暈染\n    放置時間較長也可能使顏色變深\n    皆屬正常現象。若介意的話\n    建議避開有調色設計的款式\n\n▪️  餅乾與水果裝飾提醒\n     蛋糕上的餅乾、水果經冷藏後\n     可能變軟或失去酥脆口感\n     屬正常現象。\n     若介意的話\n     建議避開有此類裝飾的款式喔～"
      },
      {
        "id": "slot_4_2",
        "category": "❓",
        "title": "寶寶/孕婦/蛋奶素客人",
        "text": "以下給您參考～\n\n✔️蛋糕原物料 \n\n▪️ 法國品牌動物性鮮奶油\n▪️ 日本低筋麵粉\n▪️ 日本明治上白糖\n▪️ 友善農場雞蛋\n▪️ 新鮮牛奶\n\n\n✔️其他成分提醒\n\n▪️ 巧克力及茶類口味含有咖啡因\n▪️ 奶凍類產品含有少量吉利丁\n▪️ 果醬皆為新鮮手工熬製\n\n\n若有寶寶、孕婦或蛋奶素需求的客人\n請依自身需求與飲食習慣，評估是否適合食用喔～💖"
      },
      {
        "id": "slot_4_3",
        "category": "🚗",
        "title": "沒有配送🚗",
        "text": "🔺關於自取蛋糕＆配送\n\n1.自取\n可於約定時間至「台南市中西區友愛街93號」門市取貨，請留意營業日與自取時間是否能配合喔，自取請指定您可以到達的時間，並準時抵達取蛋糕！不接受遲到喔！🙏🏻\n\n\n2.自行找跑腿司機\n若是不方便自取蛋糕，可以由客人自行叫車，請司機跑腿進門店來取貨，例如lalamove或是台南跑腿公司，請在自取時間內過來取糕，蛋糕本身脆弱也容易受到溫度影響而化開，自行尋找的配送方式，若是離開工作室，在運送過程中有任何毀損、奶油化開或是缺少任何一樣商品等等，我們工作室不負責任，採取此配送方法，需自行評估風險。\n\n\n3.超商物流公司\n蛋糕沒有配合的物流公司例如：黑貓宅配，動物鮮奶油蛋糕很脆弱，不適合此配送方式"
      },
      {
        "id": "slot_4_4",
        "category": "⭐️",
        "title": "這種沒有",
        "text": "您好～不好意思😣\n圖片這種蛋糕我們沒有呢🙏🏻\n\n建議可以從我們IG挑選款式\n也會是我們比較擅長的風格呦！\n謝謝您🫶🏻\n\nhttps://www.instagram.com/wuyi_cake_studio/"
      },
      {
        "id": "slot_4_5",
        "category": "😊",
        "title": "其他店家",
        "text": "這是其他蛋糕店的照片與風格，\n如要做同款，不能保證與圖片100%像喔！\n每一家店使用的的色素材料和手藝都不同，\n所以做出來的蛋糕成品不會跟您的圖片一模一樣唷💕"
      },
      {
        "id": "slot_4_6",
        "category": "😊",
        "title": "做不了漢堡盒",
        "text": "您好～\n\n這款屬於整模蛋糕\n不太適合製作成漢堡盒款式呢\n\n因為漢堡盒有固定的盒子高度，\n若使用這款造型，盒蓋會碰到裝飾喔\n\n建議您可以先參考我們 IG 上的漢堡盒款式\n再傳給我們協助報價喔～\n\n蛋糕作品：https://www.instagram.com/wuyi_cake_studio/"
      },
      {
        "id": "slot_4_7",
        "category": "❓",
        "title": "諮詢 公仔",
        "text": "蛋糕公仔\n\n蛋糕上的公仔可以自行購買\n再提供給我們～🤍\n\n\n📏 尺寸建議：寬5cm × 高8cm\n\n\n📍 交付方式\n請於門市營業日親自送至門市：\n台南市中西區友愛街 93 號\n時間：下午 3:00～7:00\n\n⚠️ 暫不接受蝦皮或超商代領取喔，謝謝您 🫶🏻"
      },
      {
        "id": "slot_4_8",
        "category": "⭐️",
        "title": "🎈氣球佈置🎈",
        "text": "𓇢 氣球佈置 .....$2700\n\n20顆氣球裝飾(地板球)\n6顆空飄氣球\nLOVE/HAPPY BIRTHDAY氣球裝飾(擇一)\n包含台南區域專人佈置\n\n\n\n𓇢 氣球佈置 .....$7299\n\n6顆18吋愛心/星星漂空氣球\n10顆空飄氣球\n20顆氣球裝飾(地板球)\nLOVE氣球裝飾/HAPPY BIRTHDAY(擇一)\n數字氣球x2\n包含台南區域專人佈置"
      },
      {
        "id": "slot_4_9",
        "category": "💐",
        "title": "👰🏻‍♀️手捧花👰🏻‍♀️",
        "text": "👰🏻‍♀️手捧花\n\n--𝒂.小手捧-- \n3-4種花材 $2280\n\n--𝒃,手捧花—\n4-6種花材 $3080\n\n✿以上花束方案皆為闆娘設計是「不指定花材跟樣式」喔\n✿可以選喜歡的色系由我們來搭配喔\n✿匯款完成後恕『無法取消訂單』， 因為鮮花有保鮮期問題，請確認需求後再下單！"
      },
      {
        "id": "slot_5_0",
        "category": "🎂",
        "title": "🧁杯子蛋糕🧁",
        "text": "杯子蛋糕__𝟭𝟮一組  $1080\n\n\n口味固定，每種\n🫐藍莓醬果粒奶油x4\n🍰原味奶香奶油x4\n🍫Oreo鹹奶油x4\n\n\n▫️裝飾為當季水果＆裝飾餅乾＆當季小花裝飾\n▫️若需要客製化，價格另計"
      },
      {
        "id": "slot_5_1",
        "category": "😊",
        "title": "💸催錢💸",
        "text": "匯款完成後，再麻煩您告知我們轉帳後五碼，\n方便核對款項並為您確認訂單喔～🤍"
      },
      {
        "id": "slot_5_2",
        "category": "🍔",
        "title": "🍔當天現貨-給客人link🍔",
        "text": "連結：\n\n好的喔～沒問題\n\n這款現貨保留給您\n\n麻煩點開連結填寫資訊＋下單喔！\n\n我們收到匯款就是訂購成功喔\n\n謝謝"
      },
      {
        "id": "slot_5_3",
        "category": "🍔",
        "title": "🍔當天現貨-給客人價格🍔",
        "text": "漢堡盒$700\n2人餐具含刀叉盤$15 （有需要可加購喔）\n\n\n•┈┈┈┈┈┈┈•\n\n\n當日現貨詢問的款式會「保留15分鐘」\n有需要預留請及時回覆告知 \n我們傳帳號給您呦！\n轉帳完成才算預留成功~\n\n\n預留成功後無法因任何因素取消及退款\n限當日於營業時間下午3~7點內領取蛋糕\n請務必確認好有需要蛋糕再預留呦！\n\n\n⚠️若您自選的款式蛋糕上有裝飾品/鮮花，我們皆會消毒清洗後擺上，\n若是無法認同接受且完美主義者，請勿下單購買，謝謝🙏🏻\n\n⚠️ 當天領取請跟我們『當面核對點交』訂購商品及加購商品是否拿齊全！\n\n\n•┈┈┈┈┈┈┈•\n\n\n✔️關於漢堡盒蛋糕\n\n▪️ 尺寸為 4 吋、單層夾餡\n    盒子尺寸 15 × 15 × 8 cm\n    約適合 1～2 人\n\n▪️ 附手提紙袋及一支隨機蠟燭，不附餐具。\n\n▪️ 可加購 2 人份餐具組（盤、叉、刀）$15\n    門市另有造型蠟燭、生日插牌及慶生道具可選購\n\n▪️ 建議自備保冷袋及保冷劑\n     現場可加購 $100\n\n▪️ 蛋糕使用動物性鮮奶油\n    不添加防腐劑及香精\n    建議取貨當天食用\n    最晚不超過 2 天。\n    食用前先冷藏 30 分鐘，口感更佳。\n\n▪️ 調色奶油及有色糖珠\n    可能出現暈色，屬正常現象\n\n▪️ 蛋糕底部有墊油紙\n     邊緣些微沾蹭屬正常製作現象\n\n\n📍 門市地址：台南市中西區友愛街93號 (15:00～19:00)"
      },
      {
        "id": "slot_5_4",
        "category": "🍔",
        "title": "💵收到現貨漢堡盒$❼⓿⓿💵",
        "text": "有收到$700❓\n\n謝謝您🫶🏻\n\n-------------------\n\n✔️現場取貨時再麻煩告訴我們\n\n❶要取『現貨蛋糕』\n❷名字\n❸電話後三碼\n\n我們會跟您核對唷！ 謝謝您的配合"
      }
    ];

    // 初始化頁面。可見格數只影響畫面，不搬動已存索引。
    let rawPages = {};
    let visibleSlots = WuyiModel.parseVisibleSlots(localStorage.getItem('wuyi_slots_per_page'));
    let pagesData = loadPagesDataFromStorage();
    migrateOfficialDefaults();

    // ===== 官方預設回覆版本更新（擴充功能專用）=====
    // 官方預設改版時：
    //  - 如果目前資料全部都是「沒改過的舊官方回覆」（或是空的）→ 直接換成新版官方預設（含排列順序）。
    //  - 否則：沒改過的舊官方回覆 → 換成新版或移除（新版已不再收錄者）；自己改過、自己新增的回覆一律保留不動；
    //    新版才有的官方回覆 → 放回它原本的位置（被佔用時放第一個空欄位）；自己刪掉的官方回覆不再加回。
    function migrateOfficialDefaults() {
      const DEFAULTS_VERSION = '1.0.2-003851d4';
      const KEY_VER = 'wuyi_defaults_version';
      const KEY_SNAP = 'wuyi_defaults_snapshot';
      // 1.0.1 以前沒有記錄快照時，以最初版的 10 則官方回覆當作比對基準
      const LEGACY_SNAPSHOT = {"remit_info":{"title":"玉山銀行匯款帳號 (下單確認)","category":"💙","text":"【匯款帳號資訊】\n銀行代號：808 玉山銀行\n戶名：梧藝工作室\n帳號：0123-940-888888\n\n匯款完成後再麻煩告知我們「帳號後五碼」與「匯款金額」，以便核對排單，感謝您！❤️"},"cake_storage":{"title":"蛋糕常溫與冷藏保存須知","category":"🎂","text":"【蛋糕保存方式提醒】\n我們的蛋糕皆為新鮮手作無添加防腐劑：\n1. 常溫離冷藏請勿超過 40 分鐘（若天氣炎熱建議加購保冰袋）。\n2. 取貨後請盡速冷藏保存，冷藏賞味期為 3 天內，冷凍可保存 7 天。"},"pickup_info":{"title":"門市自取地址與營業時間","category":"🚗","text":"【門市自取須知】\n門市地址：台北市大安區光復南路OO巷OO號\n取貨時間：週三至週日 12:00 - 19:30\n抵達時向櫃檯店員報「訂購人姓名與電話」即可領取蛋糕與花束喔！"},"flower_care":{"title":"鮮花花束保水與照護說明","category":"💐","text":"【花束照護小提醒】\n花束底部均附有保水花泥/水袋，建議取貨當天拆除包裝後將花莖剪斜角插水瓶，每日換水並放置於陰涼通風處，避免陽光直曬或冷氣出風口直吹喔！"},"delivery_info":{"title":"雙北汽車外送專送說明","category":"🚗","text":"【外送配送須知】\n雙北地區配合 Lalamove 汽車專送，依距離跳錶計算實報實銷。\n蛋糕為冷藏專送、花束會妥善固定，歡迎提供「確切外送地址與送達時間」為您試算運費喔！"},"addon_acc":{"title":"餐具／造型蠟燭／數字蠟燭說明","category":"‼️","text":"【餐具與蠟燭配件】\n蛋糕皆附贈「單支金細蠟燭 1 支」與蛋糕刀。\n若需要造型蠟燭($45/$55)、數字蠟燭($30/個)或額外盤叉餐具（2人$15/5人$30/10人$50），都可以幫您加購登記喔！"},"thank_confirm":{"title":"款項核對完成＆訂單確認成立","category":"❤️","text":"您好呀～已經收到您的匯款囉！款項核對無誤，訂單已為您排程排單製作！🌸\n取貨日前一天會再發送提醒訊息給您，非常感謝您的支持！"},"burger_stock":{"title":"現貨 🍔登記完成🍔","category":"🍔","text":"您好呀～已為您保留現貨並完成登記囉！🍔 請於約定時間內前來門市取貨，謝謝您！"},"greeting_hello":{"title":"親切迎賓招呼語","category":"😊","text":"您好呀～歡迎光臨梧藝！🌸 請問今天有想了解蛋糕、花束或是專屬客製甜點的服務嗎？很樂意為您介紹與服務喔！"},"praise_thanks":{"title":"收到滿意好評感謝","category":"👍","text":"太開心聽到您的喜歡了！看到您和朋友吃得開心就是我們最大的動力與幸福🥰 期待下次再為您製作美味的蛋糕與花禮！"}};
      const pick = it => ({ title: it.title || '', category: it.category || '', text: it.text || '' });
      const same = (a, b) => !!(a && b) && a.title === b.title && a.category === b.category && a.text === b.text;
      try {
        if (localStorage.getItem(KEY_VER) === DEFAULTS_VERSION) return;
        let snap = null;
        try { snap = JSON.parse(localStorage.getItem(KEY_SNAP) || 'null'); } catch (e) { snap = null; }
        if (!snap) snap = LEGACY_SNAPSHOT;
        const newById = {};
        defaultPage1Replies.forEach((d, i) => { newById[d.id] = { d, p: Math.floor(i / SLOTS_PER_PAGE) + 1, s: i % SLOTS_PER_PAGE }; });
        const isUntouchedOld = it => !!(it && it.id && snap[it.id] && same(pick(it), snap[it.id]));
        const clone = o => JSON.parse(JSON.stringify(o));

        const all = [];
        for (let p = 1; p <= TOTAL_PAGES; p++) for (let s = 0; s < (pagesData[p] ? pagesData[p].length : 0); s++) if (pagesData[p][s]) all.push(pagesData[p][s]);

        let updated = 0, removed = 0, added = 0, kept = 0, replacedAll = false;
        if (all.every(isUntouchedOld)) {
          // 全部都是沒動過的官方回覆 → 整批換新
          const data = {};
          for (let p = 1; p <= TOTAL_PAGES; p++) data[p] = Array(WuyiModel.MAX_STORED_SLOTS).fill(null);
          defaultPage1Replies.forEach((d, i) => {
            const p = Math.floor(i / SLOTS_PER_PAGE) + 1;
            if (p <= TOTAL_PAGES) data[p][i % SLOTS_PER_PAGE] = clone(d);
          });
          const changed = JSON.stringify(data) !== JSON.stringify(pagesData);
          pagesData = data;
          replacedAll = changed;
        } else {
          for (let p = 1; p <= TOTAL_PAGES; p++) for (let s = 0; s < pagesData[p].length; s++) {
            const it = pagesData[p][s];
            if (!it) continue;
            if (isUntouchedOld(it)) {
              const nw = newById[it.id];
              if (!nw) { pagesData[p][s] = null; removed++; }
              else if (!same(pick(it), pick(nw.d))) { pagesData[p][s] = clone(nw.d); updated++; }
            } else if (it.id && newById[it.id] && !same(pick(it), pick(newById[it.id].d))) {
              kept++;
            }
          }
          const present = new Set();
          for (let p = 1; p <= TOTAL_PAGES; p++) pagesData[p].forEach(it => { if (it && it.id) present.add(it.id); });
          const firstEmpty = () => {
            for (let p = 1; p <= TOTAL_PAGES; p++) for (let s = 0; s < pagesData[p].length; s++) if (!pagesData[p][s]) return { p, s };
            return null;
          };
          defaultPage1Replies.forEach(d => {
            if (present.has(d.id) || snap[d.id]) return; // 已存在，或是使用者刪掉的舊官方回覆
            const want = newById[d.id];
            const pos = (want.p <= TOTAL_PAGES && !pagesData[want.p][want.s]) ? want : firstEmpty();
            if (pos) { pagesData[pos.p][pos.s] = clone(d); added++; }
          });
        }

        const newSnap = {};
        defaultPage1Replies.forEach(d => { newSnap[d.id] = pick(d); });
        localStorage.setItem(KEY_SNAP, JSON.stringify(newSnap));
        localStorage.setItem(KEY_VER, DEFAULTS_VERSION);
        if (replacedAll || updated || added || removed) {
          savePagesDataToStorage();
          const msg = replacedAll
            ? `已更新為新版官方預設回覆（共 ${defaultPage1Replies.length} 則）`
            : `官方預設回覆已更新：更新 ${updated}、新增 ${added}、移除舊版 ${removed} 則` + (kept ? `；你改過的 ${kept} 則保留不動` : '');
          setTimeout(() => showToast(msg, '🔄'), 600);
        }
      } catch (e) {
        console.error('Defaults migrate error:', e);
      }
    }

    function applyLegacyCategories(pages) {
      for (let p = 1; p <= TOTAL_PAGES; p++) {
        const page = pages[p];
        if (!Array.isArray(page)) continue;
        page.forEach(it => {
          if (it) it.category = legacyCategoryMap[it.category] || it.category || '⭐️';
        });
      }
      return pages;
    }

    function loadPagesDataFromStorage() {
      try {
        const saved = localStorage.getItem('wuyi_100_pages_data');
        if (saved) {
          let parsed = null;
          try { parsed = JSON.parse(saved); } catch (e) { parsed = null; }
          const normalized = WuyiModel.normalizePages(parsed || {});
          rawPages = normalized.rawPages;
          applyLegacyCategories(normalized.pages);
          if (normalized.writeBack) {
            localStorage.setItem('wuyi_100_pages_data', JSON.stringify(WuyiModel.serializePagesForStorage(normalized.pages, normalized.rawPages)));
          }
          return normalized.pages;
        }

        const oldSaved = localStorage.getItem('wuyi_custom_replies');
        let oldList = defaultPage1Replies;
        if (oldSaved) {
          try {
            const parsedOld = JSON.parse(oldSaved);
            if (Array.isArray(parsedOld) && parsedOld.length > 0) oldList = parsedOld;
          } catch (e) {}
        }
        oldList.forEach(item => {
          if (item) item.category = legacyCategoryMap[item.category] || item.category || '⭐️';
        });
        rawPages = {};
        return WuyiModel.pagesFromFlatList(oldList);
      } catch (e) {
        console.error('Storage load error:', e);
        rawPages = {};
        return WuyiModel.pagesFromFlatList([]);
      }
    }

    function savePagesDataToStorage() {
      try {
        localStorage.setItem('wuyi_100_pages_data', JSON.stringify(WuyiModel.serializePagesForStorage(pagesData, rawPages)));
      } catch (e) {
        console.error('Storage save error:', e);
      }
    }

    function renderSlotsPerPageControl() {
      const host = document.getElementById('slotsPerPageControl');
      if (!host) return;
      host.innerHTML = '<span>每頁格數</span>' + [10, 15, 20].map(n =>
        `<button type="button" class="${n === visibleSlots ? 'active' : ''}" data-on-click="setVisibleSlotsFromUi(${n})" aria-label="每頁顯示 ${n} 格">${n}</button>`
      ).join('');
    }

    function setVisibleSlotsFromUi(n) {
      visibleSlots = n;
      localStorage.setItem('wuyi_slots_per_page', String(n));
      renderSlotsPerPageControl();
      renderMainPageNav();
      renderReplies();
    }

    // 渲染主畫面 10 頁切換列 (極簡 ◀ 1..10 ▶，支援懸停拖放換頁)
    function renderMainPageNav() {
      const container = document.getElementById('mainPagePills');
      if (!container) return;

      let html = `
        <button type="button" class="btn-page-arrow" data-on-click="changeMainPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} title="上一頁">
          ◀
        </button>
      `;

      for (let p = 1; p <= TOTAL_PAGES; p++) {
        const label = WuyiModel.pageAriaLabel(p, pagesData[p] || [], visibleSlots);
        const dot = WuyiModel.pageHasHidden(pagesData[p] || [], visibleSlots) ? '<span class="hidden-dot"></span>' : '';
        html += `
          <button type="button" 
                  class="page-num-btn ${p === currentPage ? 'active' : ''}" 
                  data-on-click="changeMainPage(${p})" 
                  data-on-dragover="handlePageButtonDragOver(event, ${p})"
                  title="第 ${p} 頁 (拖曳懸停可切換)"
                  aria-label="${label}">
            ${p}${dot}
          </button>
        `;
      }

      html += `
        <button type="button" class="btn-page-arrow" data-on-click="changeMainPage(${currentPage + 1})" ${currentPage === TOTAL_PAGES ? 'disabled' : ''} title="下一頁">
          ▶
        </button>
      `;

      container.innerHTML = html;
    }

    function changeMainPage(p) {
      if (p < 1 || p > TOTAL_PAGES) return;
      currentPage = p;
      renderMainPageNav();
      renderReplies();
      // 切換分頁平滑滾動至列表頂部
      const listEl = document.getElementById('repliesContainer');
      if (listEl) {
        listEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    // 渲染主畫面回覆卡片
    function renderReplies() {
      const container = document.getElementById('repliesContainer');
      if (!container) return;

      const searchKeyword = document.getElementById('searchInput').value.trim().toLowerCase();
      const isFiltering = (currentCategory !== 'all' || searchKeyword.length > 0);

      let itemsToRender = [];

      if (isFiltering) {
        for (let p = 1; p <= TOTAL_PAGES; p++) {
          const page = pagesData[p];
          if (!Array.isArray(page)) continue;
          page.forEach((item, slotIdx) => {
            if (!item) return;
            const matchCategory = (currentCategory === 'all' || item.category === currentCategory);
            const matchKeyword = !searchKeyword || item.title.toLowerCase().includes(searchKeyword) || item.text.toLowerCase().includes(searchKeyword);
            if (matchCategory && matchKeyword) {
              itemsToRender.push({ ...item, pageNum: p, slotIndex: slotIdx, hidden: slotIdx >= visibleSlots });
            }
          });
        }

        if (itemsToRender.length === 0) {
          container.innerHTML = `
            <div style="text-align:center; padding:30px 10px; color:#94a3b8; font-size:13px; background:#fff; border-radius:8px;">
              查無相關常用回覆，建議上方直接打字或語音輸入，點擊「AI 潤飾」！
            </div>`;
          return;
        }

        container.innerHTML = itemsToRender.map(item => buildReplyCardHtml(item, item.pageNum, item.slotIndex, item.hidden)).join('');
      } else {
        const currentSlots = pagesData[currentPage] || [];
        const rawNote = Object.prototype.hasOwnProperty.call(rawPages, String(currentPage)) ? WuyiModel.rawPageNotice(currentPage) : '';
        const hiddenNote = rawNote || WuyiModel.hiddenNotice(currentSlots, visibleSlots);
        let cardsHtml = hiddenNote ? `<div class="hidden-notice">${hiddenNote}</div>` : '';

        for (let s = 0; s < visibleSlots; s++) {
          const item = currentSlots[s];
          if (item) {
            cardsHtml += buildReplyCardHtml(item, currentPage, s);
          } else {
            // 空欄位卡片 (點擊可立即編輯填入，亦可作為拖放目標)
            cardsHtml += `
              <div class="empty-slot-card" 
                   id="emptyCard_${currentPage}_${s}" 
                   data-on-click="openEditModal(${currentPage}, ${s})"
                   data-on-dragover="handleDragOver(event)"
                   data-on-dragleave="handleDragLeave(event)"
                   data-on-drop="handleDrop(event, ${currentPage}, ${s})">
                <span style="font-size:12px; color:#94a3b8; font-weight:600;">＋ 空欄位（點擊填寫，可拖曳換位）</span>
                <button type="button" class="btn-card-edit" style="pointer-events:none; width:auto; padding:0 6px; font-size:10.5px;">
                  <span>✏️ 填寫</span>
                </button>
              </div>
            `;
          }
        }

        container.innerHTML = cardsHtml;
      }
    }

    function buildReplyCardHtml(item, pageNum, slotIdx) {
      const emoji = item.category || '⭐️';
      const titleText = escapeHtml(item.title || '常用回覆');
      // 只要標題含有 emoji 就不重複加，否則前面帶上該類別的 emoji
      const displayTitle = (item.title && /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}]/u.test(item.title))
        ? titleText
        : `<span class="reply-emoji-tag">${emoji}</span> ${titleText}`;

      return `
        <div class="reply-card"
             id="replyCard_${pageNum}_${slotIdx}"
             data-page="${pageNum}"
             data-slot="${slotIdx}"
             title="點一下貼進 LINE 對話框&#10;（長按 3 秒可移動欄位／換頁；也可拖曳換位）"
             data-on-click="handleCardClick(event, ${pageNum}, ${slotIdx})"
             data-on-mousedown="startLongPress(event, ${pageNum}, ${slotIdx})"
             data-on-mouseup="cancelLongPress()"
             data-on-mouseleave="cancelLongPress()"
             data-on-touchstart="handleTouchStart(event, ${pageNum}, ${slotIdx})"
             data-on-touchmove="handleTouchMove(event)"
             data-on-touchend="cancelLongPress()"
             data-on-touchcancel="cancelLongPress()"
             draggable="true"
             data-on-dragstart="handleDragStart(event, ${pageNum}, ${slotIdx})"
             data-on-dragover="handleDragOver(event)"
             data-on-dragleave="handleDragLeave(event)"
             data-on-drop="handleDrop(event, ${pageNum}, ${slotIdx})">
          <div class="reply-card-left">
            <span class="reply-card-title">${displayTitle}</span>
          </div>
          <div class="reply-card-right">
            <!-- 編輯按鈕 -->
            <button type="button" class="btn-card-edit" data-on-click="openEditModal(${pageNum}, ${slotIdx})" title="編輯文字內容">
              <span>✏️</span>
            </button>
            <!-- 複製按鈕 (防閃退安全複製) -->
            <button type="button" class="btn-main-copy" id="btnCopy_${item.id || (pageNum + '_' + slotIdx)}" data-on-click="copyTextDirect(this, \`${encodeURIComponent(item.text)}\`)" title="複製" aria-label="複製">
              <span>📋</span>
            </button>
          </div>
        </div>
      `;
    }

    function escapeHtml(text) {
      if (!text) return '';
      return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    // 分類篩選切換
    function selectCategory(cat, el) {
      currentCategory = cat;
      document.querySelectorAll('.cat-pill').forEach(btn => btn.classList.remove('active'));
      el.classList.add('active');
      renderReplies();
    }

    function filterReplies() {
      renderReplies();
    }

    function fillToDraft(encodedText) {
      const text = decodeURIComponent(encodedText);
      document.getElementById('draftInput').value = text;
      showToast('已填入上方編輯框，可微調後再複製');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ================= 終極防閃退安全剪貼簿複製 (Safe Clipboard) =================
    let isCopying = false;
    let toastTimeout = null;

    function performSafeCopy(text, onSuccess) {
      if (isCopying) return;
      isCopying = true;

      const finish = () => {
        isCopying = false;
        if (typeof onSuccess === 'function') {
          try { onSuccess(); } catch (err) { console.error('Callback error:', err); }
        }
      };

      // 現代 Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
          .then(finish)
          .catch(() => {
            fallbackExecCopy(text, finish);
          });
      } else {
        fallbackExecCopy(text, finish);
      }
    }

    // 解決 iOS Safari 與 Chrome 座標超出或鍵盤彈出導致的「閃退」
    function fallbackExecCopy(text, onComplete) {
      let ta = null;
      try {
        ta = document.createElement('textarea');
        ta.value = text;
        // 關鍵：唯讀且固定在可見區域微小透明層，絕不使用 -9999px 導致 WebKit 繪圖樹崩潰
        ta.setAttribute('readonly', '');
        ta.setAttribute('contenteditable', 'false');
        ta.style.position = 'fixed';
        ta.style.top = '0';
        ta.style.left = '0';
        ta.style.width = '20px';
        ta.style.height = '20px';
        ta.style.padding = '0';
        ta.style.border = 'none';
        ta.style.outline = 'none';
        ta.style.boxShadow = 'none';
        ta.style.background = 'transparent';
        ta.style.opacity = '0.01';
        ta.style.fontSize = '16px'; // 徹底杜絕 iOS Safari 視口跳動與放大閃退
        ta.style.zIndex = '-1';

        document.body.appendChild(ta);

        if (navigator.userAgent.match(/ipad|iphone/i)) {
          const range = document.createRange();
          range.selectNodeContents(ta);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          ta.setSelectionRange(0, 999999);
        } else {
          ta.focus();
          ta.select();
        }

        document.execCommand('copy');
      } catch (err) {
        console.error('Safe fallback copy error:', err);
      } finally {
        if (ta && ta.parentNode) {
          ta.parentNode.removeChild(ta);
        }
        if (onComplete) onComplete();
      }
    }

    // 防閃退複製按鈕
    function copyTextDirect(btn, encodedText) {
      const text = decodeURIComponent(encodedText);
      performSafeCopy(text, () => {
        if (btn) {
          btn.classList.add('copied');
          btn.innerHTML = btn.closest('.reply-card') ? '<span>✓</span>' : '<span>✓ 已複製</span>';
          setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = btn.closest('.reply-card') ? '<span>📋</span>' : '<span>📋 複製</span>';
          }, 1500);
        }
        showToast('已複製！請直接在官方 LINE 對話框 貼上發送');
      });
    }

    // 貼上按鈕：把文字貼進 chat.line.biz 目前開著的對話框（只貼上，不會自動傳送）
    function sendDirectToLine(encodedText) {
      const text = decodeURIComponent(encodedText);
      window.WuyiPaste.pasteToLine(text);
    }

    function copyDraftText() {
      const text = document.getElementById('draftInput').value.trim();
      if (!text) {
        showToast('請先輸入或語音錄入文字再複製！', '⚠️');
        return;
      }
      performSafeCopy(text, () => {
        showToast('已複製編輯框內容！請至 LINE 貼上');
      });
    }

    // ================= 編輯單筆 Modal 邏輯 =================
    let editingPage = 1;
    let editingSlot = 0;

    function openEditModal(pageNum, slotIdx) {
      editingPage = pageNum;
      editingSlot = slotIdx;

      const item = pagesData[pageNum][slotIdx] || { title: '', category: 'payment', text: '' };
      document.getElementById('editReplyId').value = `${pageNum}_${slotIdx}`;
      document.getElementById('editReplyTitle').value = item.title || '';
      document.getElementById('editReplyCat').value = item.category || 'payment';
      document.getElementById('editReplyText').value = item.text || '';

      const modalTitle = document.querySelector('#editModal .modal-title');
      if (modalTitle) {
        modalTitle.textContent = `✏️ 編輯回覆：第 ${pageNum} 頁 - 第 ${slotIdx + 1} 欄位`;
      }

      document.getElementById('editModal').classList.add('show');
    }

    function closeEditModal() {
      document.getElementById('editModal').classList.remove('show');
    }

    function closeEditModalOnBg(e) {
      if (e.target.id === 'editModal') closeEditModal();
    }

    function saveEditReply() {
      const title = document.getElementById('editReplyTitle').value.trim();
      const cat = document.getElementById('editReplyCat').value;
      const text = document.getElementById('editReplyText').value.trim();

      if (!title && !text) {
        // 清空該欄位
        pagesData[editingPage][editingSlot] = null;
        savePagesDataToStorage();
        renderMainPageNav();
        renderReplies();
        closeEditModal();
        showToast('已清空該欄位');
        return;
      }

      pagesData[editingPage][editingSlot] = {
        id: `slot_${editingPage}_${editingSlot}`,
        category: cat || '⭐️',
        title: title || `回覆 P${editingPage}-${editingSlot + 1}`,
        text: text
      };

      savePagesDataToStorage();
      renderMainPageNav();
      renderReplies();
      closeEditModal();
      showToast('✅ 已成功儲存修改！');
    }

    // ================= 常用回覆管理 Modal (10 頁 x 10 欄位) =================
    function openManageModal() {
      modalPage = currentPage;
      document.getElementById('manageModal').classList.add('show');
      renderModalPageSelector();
      renderModalTenSlots();
      renderModalList();
    }

    function closeManageModal() {
      document.getElementById('manageModal').classList.remove('show');
    }

    function closeModalOnBg(e) {
      if (e.target.id === 'manageModal') closeManageModal();
    }

    function switchModalTab(tab) {
      ['batch', 'single', 'list'].forEach(t => {
        document.getElementById(`tabBtn${t.charAt(0).toUpperCase() + t.slice(1)}`).classList.toggle('active', t === tab);
        document.getElementById(`tabContent${t.charAt(0).toUpperCase() + t.slice(1)}`).classList.toggle('active', t === tab);
      });
      if (tab === 'batch') {
        renderModalPageSelector();
        renderModalTenSlots();
      }
      if (tab === 'list') renderModalList();
    }

    function renderModalPageSelector() {
      const container = document.getElementById('modalPageSelector');
      if (!container) return;

      let html = '';
      for (let p = 1; p <= TOTAL_PAGES; p++) {
        html += `
          <button type="button" class="modal-page-btn ${p === modalPage ? 'active' : ''}" data-on-click="changeModalPage(${p})">
            ${p}
          </button>
        `;
      }
      container.innerHTML = html;

      const lbl = document.getElementById('editingPageLabel');
      if (lbl) lbl.textContent = `第 ${modalPage} 頁（欄位 #1 ~ #10）`;
    }

    function changeModalPage(p) {
      modalPage = p;
      renderModalPageSelector();
      renderModalTenSlots();
    }

    function renderModalTenSlots() {
      const container = document.getElementById('tenSlotsContainer');
      if (!container) return;

      const catOptions = ['💐', '🌹', '🎂', '🍔', '🔥', '🚗', '⭐️', '‼️', '❓', '😊', '👍', '💙', '❤️'].map(e => ({ value: e, label: e }));

      const currentSlots = pagesData[modalPage];
      let html = '';

      for (let i = 0; i < SLOTS_PER_PAGE; i++) {
        const item = currentSlots[i] || { title: '', category: '⭐️', text: '' };
        html += `
          <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; padding:7px 9px; display:flex; flex-direction:column; gap:4px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:11.5px; font-weight:700; color:#1e293b;">📌 欄位 #${i + 1} (頁碼 P${modalPage})</span>
              <select id="slotCat_${i}" class="modal-input" style="width:auto; height:24px; padding:0 6px; font-size:11px;">
                ${catOptions.map(opt => `<option value="${opt.value}" ${item.category === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
              </select>
            </div>
            <input type="text" id="slotTitle_${i}" class="modal-input" placeholder="標題 (例：玉山銀行匯款帳號)" value="${escapeHtml(item.title || '')}" style="height:25px; font-size:12px;">
            <textarea id="slotText_${i}" class="modal-textarea" placeholder="回覆內文內容..." style="height:50px; font-size:12px; margin:0;">${escapeHtml(item.text || '')}</textarea>
          </div>
        `;
      }

      container.innerHTML = html;
    }

    function saveCurrentModalPageSlots() {
      for (let i = 0; i < SLOTS_PER_PAGE; i++) {
        const titleEl = document.getElementById(`slotTitle_${i}`);
        const catEl = document.getElementById(`slotCat_${i}`);
        const textEl = document.getElementById(`slotText_${i}`);

        if (titleEl && textEl) {
          const title = titleEl.value.trim();
          const text = textEl.value.trim();
          const cat = catEl ? catEl.value : '⭐️';

          if (title || text) {
            pagesData[modalPage][i] = {
              id: `slot_${modalPage}_${i}`,
              category: cat,
              title: title || `回覆 P${modalPage}-${i + 1}`,
              text: text
            };
          } else {
            pagesData[modalPage][i] = null;
          }
        }
      }

      savePagesDataToStorage();
      renderMainPageNav();
      renderReplies();
      closeManageModal();
      showToast(`🎉 成功儲存第 ${modalPage} 頁的 10 個欄位！`);
    }

    function clearCurrentModalPageSlots() {
      if (!confirm(`確定要清空第 ${modalPage} 頁的所有欄位嗎？`)) return;
      for (let i = 0; i < SLOTS_PER_PAGE; i++) {
        const t = document.getElementById(`slotTitle_${i}`);
        const txt = document.getElementById(`slotText_${i}`);
        if (t) t.value = '';
        if (txt) txt.value = '';
      }
      showToast(`已清空第 ${modalPage} 頁欄位表格（點下方儲存即生效）`);
    }

    // 單筆新增（自動放入第一個空卡位）
    function saveSingleReply() {
      const title = document.getElementById('newReplyTitle').value.trim();
      const cat = document.getElementById('newReplyCat').value;
      const text = document.getElementById('newReplyText').value.trim();

      if (!title || !text) {
        showToast('請填寫標題與回覆內文！', '⚠️');
        return;
      }

      // 找尋第一個空位
      let targetP = -1, targetS = -1;
      for (let p = 1; p <= TOTAL_PAGES; p++) {
        for (let s = 0; s < SLOTS_PER_PAGE; s++) {
          if (!pagesData[p][s]) {
            targetP = p; targetS = s;
            break;
          }
        }
        if (targetP !== -1) break;
      }

      if (targetP === -1) {
        showToast('全部 100 個欄位皆已滿！請先編輯或清空部分欄位', '⚠️');
        return;
      }

      pagesData[targetP][targetS] = {
        id: `slot_${targetP}_${targetS}`,
        category: cat || '⭐️',
        title: title,
        text: text
      };

      savePagesDataToStorage();
      currentPage = targetP;
      renderMainPageNav();
      renderReplies();
      closeManageModal();
      document.getElementById('newReplyTitle').value = '';
      document.getElementById('newReplyText').value = '';
      showToast(`✅ 已自動存入第 ${targetP} 頁 - 欄位 #${targetS + 1}！`);
    }

    function renderModalList() {
      const listEl = document.getElementById('modalRepliesList');
      if (!listEl) return;

      let allItems = [];
      for (let p = 1; p <= TOTAL_PAGES; p++) {
        pagesData[p].forEach((item, slotIdx) => {
          if (item) allItems.push({ ...item, page: p, slot: slotIdx });
        });
      }

      if (allItems.length === 0) {
        listEl.innerHTML = '<div style="font-size:12px; color:#94a3b8; text-align:center; padding:15px;">目前尚無設定任何回覆</div>';
        return;
      }

      listEl.innerHTML = allItems.map(item => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; border:1px solid #cbd5e1; padding:6px 9px; border-radius:6px;">
          <div style="font-size:12px; color:#1e293b; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:320px;">
            <b style="color:var(--primary-dark);">P${item.page}-${item.slot + 1}</b> ${escapeHtml(item.title)}
          </div>
          <button type="button" data-on-click="deleteReplyByCoordinate(${item.page}, ${item.slot})" style="background:#fee2e2; color:#ef4444; border:none; border-radius:4px; padding:2px 7px; font-size:10.5px; font-weight:700; cursor:pointer;">
            刪除
          </button>
        </div>
      `).join('');
    }

    function deleteReplyByCoordinate(p, s) {
      if (!confirm(`確定要刪除 P${p}-${s + 1} 這則回覆嗎？`)) return;
      pagesData[p][s] = null;
      savePagesDataToStorage();
      renderMainPageNav();
      renderReplies();
      renderModalList();
      showToast('已刪除該欄位回覆');
    }

    function resetToDefaultReplies() {
      if (!confirm('確定要恢復預設官方範本嗎？所有頁面自訂內容將被重置')) return;
      localStorage.removeItem('wuyi_100_pages_data');
      localStorage.removeItem('wuyi_custom_replies');
      pagesData = loadPagesDataFromStorage();
      currentPage = 1;
      renderMainPageNav();
      renderReplies();
      renderModalPageSelector();
      renderModalTenSlots();
      renderModalList();
      showToast('已恢復官方預設範本');
    }

    // AI 潤飾功能
    function polishWithAI() {
      const input = document.getElementById('draftInput');
      const raw = input.value.trim();
      if (!raw) {
        showToast('請先輸入或語音錄入簡短文字！', '⚠️');
        return;
      }
      showToast('✨ AI 正在潤飾溫柔客服口吻...', '⏳');

      setTimeout(() => {
        let polished = `您好呀～🌸\n${raw}\n\n您再麻煩幫我們確認一下喔，有任何需要調整或疑問隨時跟我們說，謝謝您！❤️`;
        input.value = polished;
        showToast('✨ 已完成 AI 潤飾！可按「複製」或「貼上」');
      }, 300);
    }

    // 語音輸入 Web Speech API
    let recognition = null;
    let isRecording = false;

    function toggleVoiceInput() {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        hideVoiceButton('此環境不支援語音辨識，請改用打字');
        return;
      }

      if (!recognition) {
        recognition = new SpeechRecognition();
        recognition.lang = 'zh-TW';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          const input = document.getElementById('draftInput');
          input.value = input.value ? (input.value + ' ' + transcript) : transcript;
          showToast('🎤 語音轉文字完成！可點擊 AI 潤飾');
        };

        recognition.onend = () => { isRecording = false; updateVoiceUI(); };
        recognition.onerror = (ev) => {
          isRecording = false; updateVoiceUI();
          const err = ev && ev.error;
          if (err === 'not-allowed' || err === 'service-not-allowed' || err === 'audio-capture') {
            hideVoiceButton('側邊欄無法使用麥克風，語音輸入已隱藏，請改用打字');
          } else if (err && err !== 'no-speech' && err !== 'aborted') {
            showToast('語音辨識失敗，請再試一次或改用打字', '⚠️');
          }
        };
      }

      if (isRecording) {
        recognition.stop();
        isRecording = false;
      } else {
        try { recognition.start(); isRecording = true; }
        catch (e) { isRecording = false; hideVoiceButton('側邊欄無法使用語音輸入，請改用打字'); }
      }
      updateVoiceUI();
    }

    function hideVoiceButton(msg) {
      const btn = document.getElementById('btnVoice');
      if (btn) btn.style.display = 'none';
      try { localStorage.setItem('wuyi_voice_disabled', '1'); } catch (e) {}
      if (msg) showToast(msg, '⚠️');
    }
    if (!(window.SpeechRecognition || window.webkitSpeechRecognition) || localStorage.getItem('wuyi_voice_disabled') === '1') {
      const vb = document.getElementById('btnVoice');
      if (vb) vb.style.display = 'none';
    }

    function updateVoiceUI() {
      const btn = document.getElementById('btnVoice');
      const txt = document.getElementById('voiceText');
      if (isRecording) {
        btn.classList.add('recording');
        txt.textContent = '聆聽中...停止';
      } else {
        btn.classList.remove('recording');
        txt.textContent = '語音輸入';
      }
    }

    // ================= 訂單報價試算器邏輯 =================
    const quoteState = {
      hasFlower390: false,
      customFlowerPrice: 0,
      hasBag: false,
      cakePrice: 0,
      hasIceBag: false,
      addons: { u2: 0, u5: 0, u10: 0, c45: 0, c55: 0 }
    };

    function toggleQuoteCollapse() {
      document.getElementById('quoteCollapse').classList.toggle('open');
    }

    function toggleFlower() {
      quoteState.hasFlower390 = !quoteState.hasFlower390;
      document.getElementById('btnFlower').classList.toggle('active', quoteState.hasFlower390);
      if (quoteState.hasFlower390) document.getElementById('flowerCustomPrice').value = '';
      calcQuote();
    }

    function onFlowerCustomInput() {
      const val = parseInt(document.getElementById('flowerCustomPrice').value, 10);
      quoteState.customFlowerPrice = (!isNaN(val) && val > 0) ? val : 0;
      if (quoteState.customFlowerPrice > 0) {
        quoteState.hasFlower390 = false;
        document.getElementById('btnFlower').classList.remove('active');
      }
      calcQuote();
    }

    function toggleBag() {
      quoteState.hasBag = !quoteState.hasBag;
      document.getElementById('btnBag').classList.toggle('active', quoteState.hasBag);
      calcQuote();
    }

    function setCakePreset(price) {
      if (quoteState.cakePrice === price) {
        quoteState.cakePrice = 0;
        document.getElementById('cakeCustomPrice').value = '';
      } else {
        quoteState.cakePrice = price;
        document.getElementById('cakeCustomPrice').value = price;
      }
      updateCakeBtnUI();
      calcQuote();
    }

    function onCakeCustomInput() {
      const val = parseInt(document.getElementById('cakeCustomPrice').value, 10);
      quoteState.cakePrice = (!isNaN(val) && val > 0) ? val : 0;
      updateCakeBtnUI();
      calcQuote();
    }

    function updateCakeBtnUI() {
      document.getElementById('cp760').classList.toggle('active', quoteState.cakePrice === 760);
      document.getElementById('cp1030').classList.toggle('active', quoteState.cakePrice === 1030);
      document.getElementById('cp1060').classList.toggle('active', quoteState.cakePrice === 1060);
    }

    function cycleAddon(key, unitPrice, label) {
      quoteState.addons[key] = (quoteState.addons[key] + 1) % 6; // 0 ~ 5 循環
      const count = quoteState.addons[key];
      const btnMap = { u2: 'btnU2', u5: 'btnU5', u10: 'btnU10', c45: 'btnC45', c55: 'btnC55' };
      const btn = document.getElementById(btnMap[key]);

      if (count === 0) {
        btn.classList.remove('active');
        btn.textContent = `${label} +$${unitPrice}`;
      } else {
        btn.classList.add('active');
        btn.textContent = `${label} x${count} +$${count * unitPrice}`;
      }
      calcQuote();
    }

    function toggleIceBag() {
      quoteState.hasIceBag = !quoteState.hasIceBag;
      document.getElementById('btnIce').classList.toggle('active', quoteState.hasIceBag);
      calcQuote();
    }

    function getQuoteSummary() {
      let items = [];
      let total = 0;

      let fPrice = quoteState.hasFlower390 ? 390 : quoteState.customFlowerPrice;
      if (fPrice > 0) { items.push(`花束$${fPrice}`); total += fPrice; }
      if (quoteState.hasBag) { items.push(`提袋$40`); total += 40; }
      if (quoteState.cakePrice > 0) { items.push(`蛋糕$${quoteState.cakePrice}`); total += quoteState.cakePrice; }

      const addonConfigs = {
        u2: { name: '2人餐具', price: 15 },
        u5: { name: '5人餐具', price: 30 },
        u10: { name: '10人餐具', price: 50 },
        c45: { name: '蠟燭', price: 45 },
        c55: { name: '蠟燭', price: 55 }
      };

      Object.keys(quoteState.addons).forEach(k => {
        const cnt = quoteState.addons[k];
        if (cnt > 0) {
          const p = cnt * addonConfigs[k].price;
          items.push(cnt === 1 ? `${addonConfigs[k].name}$${p}` : `${addonConfigs[k].name}x${cnt}$${p}`);
          total += p;
        }
      });

      if (quoteState.hasIceBag) { items.push(`保冰袋$100`); total += 100; }

      return { items, total };
    }

    function calcQuote() {
      const { total } = getQuoteSummary();
      document.getElementById('totalBadge').textContent = `加總 $${total}`;
      const tv = document.getElementById('quoteTotalValue');
      if (tv) tv.textContent = `$${total}`;
      const ti = document.getElementById('quoteTotalItems');
      if (ti) { const { items } = getQuoteSummary(); ti.textContent = items.length ? items.join('　') : '尚未選擇品項'; }
    }

    function buildQuoteText() {
      const { items, total } = getQuoteSummary();
      const list = items.length > 0 ? items.join('\n') + `\n總共$${total}` : `總共$${total}`;
      return `您好呀～\n幫您加總一下\n\n${list}\n\n您再麻煩確認一下對不對喔\n謝謝您`;
    }

    function copyQuoteText() {
      const { items } = getQuoteSummary();
      if (items.length === 0) {
        showToast('請先選擇或輸入至少一項品項金額！', '⚠️');
        return;
      }
      const text = buildQuoteText();
      performSafeCopy(text, () => {
        showToast('已複製報價文案！請直接貼到官方 LINE 對話框');
      });
    }

    function pasteQuoteText() {
      const { items } = getQuoteSummary();
      if (items.length === 0) {
        showToast('請先選擇或輸入至少一項品項金額！', '⚠️');
        return;
      }
      window.WuyiPaste.pasteToLine(buildQuoteText());
    }

    function pasteDraftText() {
      const text = document.getElementById('draftInput').value.trim();
      if (!text) {
        showToast('請先輸入或語音錄入文字再貼上！', '⚠️');
        return;
      }
      window.WuyiPaste.pasteToLine(text);
    }

    function resetQuote() {
      quoteState.hasFlower390 = false;
      quoteState.customFlowerPrice = 0;
      quoteState.hasBag = false;
      quoteState.cakePrice = 0;
      quoteState.hasIceBag = false;
      quoteState.addons = { u2: 0, u5: 0, u10: 0, c45: 0, c55: 0 };

      document.getElementById('btnFlower').classList.remove('active');
      document.getElementById('flowerCustomPrice').value = '';
      document.getElementById('btnBag').classList.remove('active');
      document.getElementById('cakeCustomPrice').value = '';
      updateCakeBtnUI();
      document.getElementById('btnIce').classList.remove('active');

      ['u2', 'u5', 'u10', 'c45', 'c55'].forEach(k => {
        const btnMap = { u2: 'btnU2', u5: 'btnU5', u10: 'btnU10', c45: 'btnC45', c55: 'btnC55' };
        const labelMap = { u2: '2人餐具 +$15', u5: '5人餐具 +$30', u10: '10人餐具 +$50', c45: '蠟燭 $45', c55: '蠟燭 $55' };
        const b = document.getElementById(btnMap[k]);
        b.classList.remove('active');
        b.textContent = labelMap[k];
      });

      calcQuote();
      showToast('已重設報價金額');
    }

    function showToast(msg, icon = '✅') {
      const t = document.getElementById('toast');
      document.getElementById('toastIcon').textContent = icon;
      document.getElementById('toastMsg').textContent = msg;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 2000);
    }

    // ================= 長按 3 秒移動欄位 / 換頁數 ＆ 拖曳排序 =================
    let longPressTimer = null;
    let longPressCard = null;
    let touchStartX = 0;
    let touchStartY = 0;
    let movingPage = 1;
    let movingSlot = 0;
    let draggedCoord = null;

    // ===== 1.0.3：點一下卡片 → 貼進 LINE 對話框（只貼上，不傳送）=====
    let cardClickSuppressed = false;
    let cardDownPos = null;
    document.addEventListener('mousedown', e => {
      cardDownPos = { x: e.clientX, y: e.clientY };
      cardClickSuppressed = false;
    }, true);
    document.addEventListener('touchstart', e => {
      const t = e.touches && e.touches[0];
      cardDownPos = t ? { x: t.clientX, y: t.clientY } : null;
      cardClickSuppressed = false;
    }, { capture: true, passive: true });

    function handleCardClick(e, pageNum, slotIdx) {
      if (e.target.closest('button, a, input, textarea, select, label')) return; // ✏️／複製 等按鈕各自處理
      if (cardClickSuppressed) { cardClickSuppressed = false; return; }          // 剛長按或拖曳過
      if (cardDownPos && Math.hypot(e.clientX - cardDownPos.x, e.clientY - cardDownPos.y) > 8) return; // 有移動＝不是點一下
      if (document.querySelector('.modal-backdrop.show')) return;
      const item = pagesData[pageNum]?.[slotIdx];
      if (!item || !item.text) return;
      const card = e.currentTarget && e.currentTarget.classList ? e.currentTarget : document.getElementById(`replyCard_${pageNum}_${slotIdx}`);
      window.WuyiPaste.pasteToLine(item.text).then(res => {
        if (card && res && res.ok) {
          card.classList.remove('pasted');
          void card.offsetWidth;
          card.classList.add('pasted');
          setTimeout(() => card.classList.remove('pasted'), 700);
        }
      });
    }

    function startLongPress(e, pageNum, slotIdx) {
      if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input') || e.target.closest('textarea')) {
        return;
      }

      cancelLongPress();
      longPressCard = { page: pageNum, slot: slotIdx };

      const cardEl = document.getElementById(`replyCard_${pageNum}_${slotIdx}`);
      if (cardEl) {
        cardEl.classList.add('pressing');
      }

      // 3秒 (3000ms) 長按計時
      longPressTimer = setTimeout(() => {
        cancelLongPress();
        cardClickSuppressed = true;
        if (navigator.vibrate) {
          try { navigator.vibrate([60, 50, 60]); } catch (err) {}
        }
        openMoveModal(pageNum, slotIdx);
      }, 3000);
    }

    function cancelLongPress() {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
      document.querySelectorAll('.reply-card.pressing').forEach(el => el.classList.remove('pressing'));
    }

    function handleTouchStart(e, pageNum, slotIdx) {
      if (e.touches && e.touches[0]) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
      startLongPress(e, pageNum, slotIdx);
    }

    function handleTouchMove(e) {
      if (!longPressTimer) return;
      if (e.touches && e.touches[0]) {
        const dist = Math.hypot(e.touches[0].clientX - touchStartX, e.touches[0].clientY - touchStartY);
        if (dist > 14) {
          cancelLongPress();
        }
      }
    }

    // 移動與換頁 Modal 控制
    function openMoveModal(p, s) {
      movingPage = p;
      movingSlot = s;

      const item = pagesData[p]?.[s];
      if (!item) return;

      const previewEl = document.getElementById('moveItemPreview');
      if (previewEl) {
        const emoji = item.category || '⭐️';
        previewEl.innerHTML = `<span class="reply-emoji-tag">${emoji}</span> ${escapeHtml(item.title || '常用回覆')}`;
      }

      const locEl = document.getElementById('moveSourceLocation');
      if (locEl) {
        locEl.textContent = `第 ${p} 頁 - 欄位 #${s + 1}`;
      }

      const pageSelect = document.getElementById('targetPageSelect');
      if (pageSelect) {
        let html = '';
        for (let i = 1; i <= TOTAL_PAGES; i++) {
          html += `<option value="${i}" ${i === p ? 'selected' : ''}>第 ${i} 頁</option>`;
        }
        pageSelect.innerHTML = html;
      }

      updateTargetSlotOptions();
      document.getElementById('moveModal')?.classList.add('show');
    }

    function updateTargetSlotOptions() {
      const pageSelect = document.getElementById('targetPageSelect');
      const slotSelect = document.getElementById('targetSlotSelect');
      if (!pageSelect || !slotSelect) return;

      const targetP = parseInt(pageSelect.value, 10);
      let html = '';
      for (let s = 0; s < SLOTS_PER_PAGE; s++) {
        const item = pagesData[targetP]?.[s];
        let desc = '(空欄位)';
        if (item && item.title) {
          desc = `${item.category || ''} ${item.title}`;
          if (desc.length > 15) desc = desc.slice(0, 15) + '...';
        }
        const isCurrent = (targetP === movingPage && s === movingSlot);
        html += `<option value="${s}" ${s === movingSlot && targetP !== movingPage ? 'selected' : ''}>
          #${s + 1} ${escapeHtml(desc)} ${isCurrent ? '👈 目前' : ''}
        </option>`;
      }
      slotSelect.innerHTML = html;
    }

    function closeMoveModal() {
      document.getElementById('moveModal')?.classList.remove('show');
    }

    function closeMoveModalOnBg(e) {
      if (e.target.id === 'moveModal') closeMoveModal();
    }

    // 快捷相對微調順序
    function moveSlotRelative(direction) {
      const targetSlot = movingSlot + direction;
      if (targetSlot < 0 || targetSlot >= SLOTS_PER_PAGE) {
        showToast(direction < 0 ? '已經在最上方了！' : '已經在最下方了！', '⚠️');
        return;
      }

      const temp = pagesData[movingPage][targetSlot];
      pagesData[movingPage][targetSlot] = pagesData[movingPage][movingSlot];
      pagesData[movingPage][movingSlot] = temp;

      savePagesDataToStorage();
      movingSlot = targetSlot;
      renderMainPageNav();
      renderReplies();
      openMoveModal(movingPage, movingSlot);
      showToast(`已移動至第 ${movingSlot + 1} 格！`);
    }

    function moveSlotToExtremes(pos) {
      const targetSlot = (pos === 'top') ? 0 : (SLOTS_PER_PAGE - 1);
      if (targetSlot === movingSlot) {
        showToast(pos === 'top' ? '已經在最前格了！' : '已經在最後格了！', '⚠️');
        return;
      }

      const item = pagesData[movingPage].splice(movingSlot, 1)[0];
      if (pos === 'top') {
        pagesData[movingPage].unshift(item);
      } else {
        pagesData[movingPage].push(item);
      }

      savePagesDataToStorage();
      movingSlot = targetSlot;
      renderMainPageNav();
      renderReplies();
      openMoveModal(movingPage, movingSlot);
      showToast(pos === 'top' ? '已移到最前格！' : '已移到最後格！');
    }

    // 指定跨頁/跨格移動 (互換 或 插入)
    function executeMove(action) {
      const targetPage = parseInt(document.getElementById('targetPageSelect').value, 10);
      const targetSlot = parseInt(document.getElementById('targetSlotSelect').value, 10);

      if (targetPage === movingPage && targetSlot === movingSlot) {
        showToast('目標位置與目前位置相同！', '⚠️');
        return;
      }

      const srcItem = pagesData[movingPage][movingSlot];

      if (action === 'swap') {
        const destItem = pagesData[targetPage][targetSlot];
        pagesData[targetPage][targetSlot] = srcItem;
        pagesData[movingPage][movingSlot] = destItem;
      } else if (action === 'insert') {
        if (targetPage === movingPage) {
          pagesData[movingPage].splice(movingSlot, 1);
          pagesData[movingPage].splice(targetSlot, 0, srcItem);
        } else {
          pagesData[movingPage][movingSlot] = null;
          pagesData[targetPage].splice(targetSlot, 0, srcItem);
          pagesData[targetPage].length = SLOTS_PER_PAGE;
        }
      }

      savePagesDataToStorage();
      currentPage = targetPage;
      renderMainPageNav();
      renderReplies();
      closeMoveModal();
      showToast(`🎉 成功移動至第 ${targetPage} 頁 - 欄位 #${targetSlot + 1}！`);
    }

    // HTML5 滑鼠拖曳排序
    function handleDragStart(e, pageNum, slotIdx) {
      cardClickSuppressed = true;
      draggedCoord = { page: pageNum, slot: slotIdx };
      e.dataTransfer.effectAllowed = 'move';
      const card = document.getElementById(`replyCard_${pageNum}_${slotIdx}`);
      card?.classList.add('dragging');
    }

    function handleDragOver(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const target = e.currentTarget;
      if (target && !target.classList.contains('drag-over')) {
        target.classList.add('drag-over');
      }
    }

    function handleDragLeave(e) {
      e.currentTarget?.classList.remove('drag-over');
    }

    function handleDrop(e, targetPage, targetSlot) {
      e.preventDefault();
      e.currentTarget?.classList.remove('drag-over');
      document.querySelectorAll('.reply-card.dragging').forEach(el => el.classList.remove('dragging'));

      if (!draggedCoord) return;
      const srcP = draggedCoord.page;
      const srcS = draggedCoord.slot;
      if (srcP === targetPage && srcS === targetSlot) return;

      const temp = pagesData[targetPage][targetSlot];
      pagesData[targetPage][targetSlot] = pagesData[srcP][srcS];
      pagesData[srcP][srcS] = temp;

      savePagesDataToStorage();
      currentPage = targetPage;
      renderMainPageNav();
      renderReplies();
      showToast(`🎉 成功調換順序至第 ${targetPage} 頁 - 欄位 #${targetSlot + 1}！`);
      draggedCoord = null;
    }

    function handlePageButtonDragOver(e, p) {
      e.preventDefault();
      if (currentPage !== p) {
        changeMainPage(p);
      }
    }

    // ================= 分割畫面模式切換 (靠右顯示 / 靠下顯示) =================
    function setSplitMode(mode, silent) {
      document.body.classList.remove('mode-right', 'mode-bottom');
      document.body.classList.add(`mode-${mode}`);

      const btnR = document.getElementById('btnSplitRight');
      const btnB = document.getElementById('btnSplitBottom');
      if (btnR) btnR.classList.toggle('active', mode === 'right');
      if (btnB) btnB.classList.toggle('active', mode === 'bottom');

      try {
        localStorage.setItem('wuyi_split_mode', mode);
      } catch (e) {}

      if (mode === 'bottom') {
        // 靠下堆疊模式時自動展開試算器，方便橫向雙欄同步操作
        const qc = document.getElementById('quoteCollapse');
        if (qc && !qc.classList.contains('open')) {
          qc.classList.add('open');
        }
      }

      if (!silent) showToast(mode === 'right' ? '已切換為：📐 靠右顯示 (適合 Chrome 左右分割)' : '已切換為：📐 靠下顯示 (適合 Chrome 上下堆疊)');
    }

    // ================= 自訂回覆資料備份與還原 =================
    function exportBackupJson() {
      try {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(pagesData, null, 2));
        const a = document.createElement('a');
        a.href = dataStr;
        a.download = `wuyi_custom_replies_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast('✅ 備份檔下載完成！您已編輯的所有資料已妥善儲存');
      } catch (err) {
        showToast('匯出失敗：' + err.message, '⚠️');
      }
    }

    function triggerImportJson() {
      const input = document.getElementById('backupFileInput');
      if (input) input.click();
    }

    function handleImportFile(event) {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          if (imported && typeof imported === 'object') {
            pagesData = imported;
            savePagesDataToStorage();
            renderMainPageNav();
            renderReplies();
            renderModalPageSelector();
            renderModalTenSlots();
            renderModalList();
            showToast('🎉 成功還原備份資料！所有回覆已載入');
          } else {
            showToast('檔案格式不符，請確認是有效的備份檔', '⚠️');
          }
        } catch (err) {
          showToast('讀取檔案失敗：' + err.message, '⚠️');
        }
      };
      reader.readAsText(file);
      event.target.value = '';
    }


    // 初始化渲染與讀取模式 (預設為適合上下堆疊分割的靠下模式)
    const savedMode = localStorage.getItem('wuyi_split_mode') || 'right';
    setSplitMode(savedMode, true);
    renderSlotsPerPageControl();
    renderMainPageNav();
    renderReplies();
  
