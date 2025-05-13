"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface VirtualKeyboardProps {
  layout: string
  onKeyPress: (char: string) => void
}

export function VirtualKeyboard({ layout, onKeyPress }: VirtualKeyboardProps) {
  const [shift, setShift] = useState(false)
  const [kanaMode, setKanaMode] = useState<"hiragana" | "katakana">("hiragana")

  // Keyboard layouts for Japanese, English, and Vietnamese
  const layouts: Record<string, string[][]> = {
    en: [
      ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
      ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
      ["z", "x", "c", "v", "b", "n", "m"],
    ],
    vi: [
      ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
      ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
      ["z", "x", "c", "v", "b", "n", "m"],
      ["á", "à", "ả", "ã", "ạ"],
      ["ă", "ắ", "ằ", "ẳ", "ẵ", "ặ"],
      ["â", "ấ", "ầ", "ẩ", "ẫ", "ậ"],
      ["é", "è", "ẻ", "ẽ", "ẹ"],
      ["ê", "ế", "ề", "ể", "ễ", "ệ"],
      ["í", "ì", "ỉ", "ĩ", "ị"],
      ["ó", "ò", "ỏ", "õ", "ọ"],
      ["ô", "ố", "ồ", "ổ", "ỗ", "ộ"],
      ["ơ", "ớ", "ờ", "ở", "ỡ", "ợ"],
      ["ú", "ù", "ủ", "ũ", "ụ"],
      ["ư", "ứ", "ừ", "ử", "ữ", "ự"],
      ["ý", "ỳ", "ỷ", "ỹ", "ỵ"],
      ["đ"],
    ],
    ja: {
      hiragana: [
        ["あ", "い", "う", "え", "お"],
        ["か", "き", "く", "け", "こ"],
        ["さ", "し", "す", "せ", "そ"],
        ["た", "ち", "つ", "て", "と"],
        ["な", "に", "ぬ", "ね", "の"],
        ["は", "ひ", "ふ", "へ", "ほ"],
        ["ま", "み", "む", "め", "も"],
        ["や", "ゆ", "よ"],
        ["ら", "り", "る", "れ", "ろ"],
        ["わ", "を", "ん"],
        ["が", "ぎ", "ぐ", "げ", "ご"],
        ["ざ", "じ", "ず", "ぜ", "ぞ"],
        ["だ", "ぢ", "づ", "で", "ど"],
        ["ば", "び", "ぶ", "べ", "ぼ"],
        ["ぱ", "ぴ", "ぷ", "ぺ", "ぽ"],
        ["ゃ", "ゅ", "ょ", "っ"],
        ["ー", "、", "。", "「", "」"],
      ],
      katakana: [
        ["ア", "イ", "ウ", "エ", "オ"],
        ["カ", "キ", "ク", "ケ", "コ"],
        ["サ", "シ", "ス", "セ", "ソ"],
        ["タ", "チ", "ツ", "テ", "ト"],
        ["ナ", "ニ", "ヌ", "ネ", "ノ"],
        ["ハ", "ヒ", "フ", "ヘ", "ホ"],
        ["マ", "ミ", "ム", "メ", "モ"],
        ["ヤ", "ユ", "ヨ"],
        ["ラ", "リ", "ル", "レ", "ロ"],
        ["ワ", "ヲ", "ン"],
        ["ガ", "ギ", "グ", "ゲ", "ゴ"],
        ["ザ", "ジ", "ズ", "ゼ", "ゾ"],
        ["ダ", "ヂ", "ヅ", "デ", "ド"],
        ["バ", "ビ", "ブ", "ベ", "ボ"],
        ["パ", "ピ", "プ", "ペ", "ポ"],
        ["ャ", "ュ", "ョ", "ッ"],
        ["ー", "、", "。", "「", "」"],
      ],
    },
  }

  // Get the current layout based on the language and mode
  const getCurrentLayout = () => {
    if (layout === "ja") {
      return layouts.ja[kanaMode]
    }
    return layouts[layout] || layouts.en
  }

  const handleKeyPress = (char: string) => {
    onKeyPress(shift ? char.toUpperCase() : char)
  }

  const handleShift = () => {
    setShift(!shift)
  }

  const handleSpace = () => {
    onKeyPress(" ")
  }

  const handleBackspace = () => {
    onKeyPress("\b") // Special character for backspace
  }

  const toggleKanaMode = () => {
    setKanaMode(kanaMode === "hiragana" ? "katakana" : "hiragana")
  }

  const currentLayout = getCurrentLayout()

  return (
    <div className="virtual-keyboard">
      {currentLayout.map((row, rowIndex) => (
        <div key={rowIndex} className="flex flex-wrap justify-center gap-1 mb-1">
          {row.map((key, keyIndex) => (
            <Button
              key={keyIndex}
              variant="outline"
              size="sm"
              className="h-8 min-w-[2rem] px-2 text-xs sm:text-sm"
              onClick={() => handleKeyPress(key)}
            >
              {shift ? key.toUpperCase() : key}
            </Button>
          ))}
        </div>
      ))}
      <div className="flex justify-center gap-1 mt-1">
        {layout === "ja" && (
          <Button variant="outline" size="sm" className="h-8 px-2" onClick={toggleKanaMode}>
            {kanaMode === "hiragana" ? "カタカナ" : "ひらがな"}
          </Button>
        )}
        <Button variant="outline" size="sm" className="h-8 px-2" onClick={handleShift}>
          Shift
        </Button>
        <Button variant="outline" size="sm" className="h-8 px-2 flex-grow" onClick={handleSpace}>
          Space
        </Button>
        <Button variant="outline" size="sm" className="h-8 px-2" onClick={handleBackspace}>
          ←
        </Button>
      </div>
    </div>
  )
}
