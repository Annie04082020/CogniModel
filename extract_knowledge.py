"""
extract_knowledge.py
本機 Python 腳本：支援從 YouTube 影片、長篇文字檔案 (.txt, .md) 或音訊檔案 (.mp3, .wav, .m4a)
透過 Google Gemini API 深度解構知識，產生概念卡片、因果配對題、迷思是非題與情境應用題。
"""

import sys
import os
import re
import json
import base64
import urllib.request
import urllib.error

SYSTEM_INSTRUCTION = """你是一位認知學習科學與深度教學專家。
用戶正在學習難度較高、抽象且不容易一眼看懂的課程內容。
你的任務是將用戶提供的【YouTube教學影片/抽象筆記/課文長文/課堂錄音】進行深度解構，幫助用戶建立真正的理解，而不是死記硬背名詞。

請務必返回嚴格符合以下 JSON 格式的數據：
{
  "deckName": "建議的牌組主題名稱（簡短精準）",
  "summary": "一句話白話總結這段知識的核心本質",
  "cards": [
    {
      "title": "概念名稱或核心機制",
      "analogy": "生活化直觀比喻（幫助快速聯想與理解本質）",
      "description": "深入淺出的機制解釋、為什麼會這樣、核心要點"
    }
  ],
  "logicPairs": [
    {
      "cause": "觸發條件 / 前提 / 原因",
      "effect": "結果 / 後續反應 / 現象",
      "explanation": "因果邏輯解說（為何 A 會導致 B）"
    }
  ],
  "mythBusters": [
    {
      "statement": "一個針對此抽象知識的論述（設計常見易混淆盲點）",
      "isCorrect": true,
      "explanation": "深度解析：為什麼對或為什麼錯？關鍵分界點是什麼？",
      "concept": "涉及的核心概念"
    }
  ],
  "scenarios": [
    {
      "scenario": "一個具體的應用情境或假設狀況",
      "question": "根據原理，會發生下列哪種現象？",
      "options": ["選項 A", "選項 B", "選項 C", "選項 D"],
      "correctIndex": 0,
      "explanation": "答案解析與推導過程"
    }
  ]
}
請以繁體中文輸出。
"""

def extract_youtube_id(url):
    pattern = r'(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})'
    match = re.search(pattern, url)
    return match.group(1) if match else None

def call_gemini(parts, api_key):
    candidate_models = ["gemini-3.8-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
    payload = {
        "contents": [{"role": "user", "parts": parts}],
        "systemInstruction": {"parts": [{"text": SYSTEM_INSTRUCTION}]},
        "generationConfig": {"responseMimeType": "application/json"}
    }
    data_bytes = json.dumps(payload).encode("utf-8")

    last_err = None
    for model in candidate_models:
        endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        req = urllib.request.Request(endpoint, data=data_bytes, headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req) as resp:
                resp_body = resp.read().decode("utf-8")
                res_json = json.loads(resp_body)
                cand_text = res_json["candidates"][0]["content"]["parts"][0]["text"]
                return json.loads(cand_text)
        except urllib.error.HTTPError as e:
            err_msg = e.read().decode("utf-8")
            if "not available" in err_msg or "not found" in err_msg or e.code == 404:
                last_err = err_msg
                continue
            print(f"Gemini API 請求錯誤: {e.code} - {err_msg}")
            sys.exit(1)
        except Exception as e:
            print(f"錯誤: {e}")
            sys.exit(1)

    print(f"所有模型嘗試均失敗: {last_err}")
    sys.exit(1)

def main():
    if len(sys.argv) < 2:
        print("使用方式:")
        print("  1. 讀取 YouTube 影片:")
        print("     python extract_knowledge.py \"https://www.youtube.com/watch?v=...\" [自訂牌組名稱] [GEMINI_API_KEY]")
        print("  2. 讀取文字檔或錄音檔:")
        print("     python extract_knowledge.py <文字檔.txt或音訊檔.mp3> [自訂牌組名稱] [GEMINI_API_KEY]")
        sys.exit(1)

    target_input = sys.argv[1]
    deck_name_arg = sys.argv[2] if len(sys.argv) > 2 else ""
    api_key = sys.argv[3] if len(sys.argv) > 3 else os.environ.get("GEMINI_API_KEY", "")

    if not api_key:
        api_key = input("請輸入您的 Gemini API Key: ").strip()

    youtube_id = extract_youtube_id(target_input)
    video_url = ""
    youtube_thumb = ""

    if youtube_id:
        print(f"辨識為 YouTube 影片 (ID: {youtube_id}) ...")
        video_url = f"https://www.youtube.com/watch?v={youtube_id}"
        youtube_thumb = f"https://img.youtube.com/vi/{youtube_id}/hqdefault.jpg"
        parts = [
            {"fileData": {"fileUri": video_url, "mimeType": "video/mp4"}},
            {"text": "這是老師指定的考試範圍 YouTube 影片。請深入觀看與聆聽此影片內容，掌握影片中講解的核心概念、原理機制、重點公式或因果邏輯，並輸出結構化理解遊戲資料。"}
        ]
    elif os.path.exists(target_input):
        ext = os.path.splitext(target_input)[1].lower()
        print(f"正在讀取檔案: {target_input} ...")

        if ext in ['.txt', '.md', '.text']:
            with open(target_input, "r", encoding="utf-8") as f:
                content = f.read()
            parts = [{"text": f"請分析以下抽象學習內容，並按照指令輸出結構化的深度學習遊戲資料：\n\n{content}"}]
        elif ext in ['.mp3', '.m4a', '.wav', '.aac', '.webm', '.ogg']:
            mime_map = {
                '.mp3': 'audio/mp3',
                '.m4a': 'audio/m4a',
                '.wav': 'audio/wav',
                '.aac': 'audio/aac',
                '.webm': 'audio/webm',
                '.ogg': 'audio/ogg'
            }
            with open(target_input, "rb") as f:
                audio_b64 = base64.b64encode(f.read()).decode("utf-8")
            parts = [
                {"inlineData": {"mimeType": mime_map.get(ext, 'audio/mp3'), "data": audio_b64}},
                {"text": "這是課堂或學習錄音，請聽取內容並進行深度理解解構，整理出核心概念卡片、因果配對、迷思破解與情境應用題。"}
            ]
        else:
            print(f"不支援的副檔名: {ext}。請提供 .txt, .md 或音訊檔 .mp3, .m4a, .wav")
            sys.exit(1)
    else:
        print(f"無效的目標或檔案不存在: {target_input}")
        sys.exit(1)

    print("呼叫 Gemini AI 進行深度認知解構中...")
    result = call_gemini(parts, api_key)
    
    if deck_name_arg:
        result["deckName"] = deck_name_arg

    output_dir = os.path.join("docs", "src", "data")
    os.makedirs(output_dir, exist_ok=True)
    cards_json_path = os.path.join(output_dir, "cards.json")

    existing_cards = []
    if os.path.exists(cards_json_path):
        try:
            with open(cards_json_path, "r", encoding="utf-8") as f:
                existing_cards = json.load(f)
        except:
            existing_cards = []

    deck_name = result.get("deckName", "YouTube 影片解析" if youtube_id else os.path.splitext(os.path.basename(target_input))[0])
    timestamp = int(os.path.getmtime(target_input) * 1000) if os.path.exists(target_input) else int(os.times()[4] * 1000)

    new_cards = []
    for idx, card in enumerate(result.get("cards", [])):
        new_cards.append({
            "id": f"cli_{timestamp}_{idx}",
            "title": card.get("title", ""),
            "description": card.get("description", ""),
            "analogy": card.get("analogy", ""),
            "imagePath": youtube_thumb,
            "videoUrl": video_url,
            "source": deck_name,
            "logicPairs": result.get("logicPairs", []) if idx == 0 else [],
            "mythBusters": result.get("mythBusters", []) if idx == 0 else [],
            "scenarios": result.get("scenarios", []) if idx == 0 else []
        })

    merged = existing_cards + new_cards
    with open(cards_json_path, "w", encoding="utf-8") as f:
        json.dump(merged, f, indent=2, ensure_ascii=False)

    print(f"\n✅ 成功提煉「{deck_name}」！")
    print(f"- 概念卡片: {len(new_cards)} 張")
    print(f"- 因果機制配對: {len(result.get('logicPairs', []))} 組")
    print(f"- 迷思是非辨析: {len(result.get('mythBusters', []))} 題")
    print(f"- 情境應用推導: {len(result.get('scenarios', []))} 題")
    print(f"- 已儲存至 {cards_json_path}")

if __name__ == "__main__":
    main()
