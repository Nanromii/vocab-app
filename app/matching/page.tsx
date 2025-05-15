"use client"

import { useState, useEffect, useRef } from "react"
import { Shuffle, RotateCcw, Clock, Trophy, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { VocabSet } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import confetti from "canvas-confetti"

type MatchingCard = {
  id: string
  wordId: string
  text: string
  language: string
  isSelected: boolean
  isMatched: boolean
  isCorrectMatch: boolean
  isIncorrectMatch: boolean
}

export default function MatchingGamePage() {
  const { toast } = useToast()
  const [vocabSets, setVocabSets] = useState<VocabSet[]>([])
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null)
  const [cards, setCards] = useState<MatchingCard[]>([])
  const [selectedCards, setSelectedCards] = useState<string[]>([])
  const [matchedPairs, setMatchedPairs] = useState<number>(0)
  const [totalPairs, setTotalPairs] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [gameCompleted, setGameCompleted] = useState<boolean>(false)
  const [timer, setTimer] = useState<number>(0)
  const [moves, setMoves] = useState<number>(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load vocabulary sets from localStorage on component mount
  useEffect(() => {
    const savedSets = localStorage.getItem("vocabSets")
    if (savedSets) {
      try {
        const sets = JSON.parse(savedSets)
        setVocabSets(sets)
      } catch (e) {
        console.error("Error loading vocabulary sets:", e)
        setVocabSets([])
      }
    }
  }, [])

  // Timer effect
  useEffect(() => {
    if (isPlaying && !gameCompleted) {
      timerRef.current = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1)
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isPlaying, gameCompleted])

  // Check for game completion
  useEffect(() => {
    if (matchedPairs > 0 && matchedPairs === totalPairs) {
      setGameCompleted(true)
      setIsPlaying(false)

      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      // Show completion message
      toast({
        title: "Chúc mừng!",
        description: `Bạn đã hoàn thành trò chơi trong ${formatTime(timer)} với ${moves} lượt!`,
      })

      // Trigger confetti effect
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const x = rect.left + rect.width / 2
        const y = rect.top + rect.height / 2

        confetti({
          particleCount: 100,
          spread: 70,
          origin: {
            x: x / window.innerWidth,
            y: y / window.innerHeight,
          },
          colors: ["#9c27b0", "#ba68c8", "#e1bee7", "#8e24aa", "#7b1fa2"],
        })
      }
    }
  }, [matchedPairs, totalPairs, timer, moves, toast])

  // Handle card selection logic
  useEffect(() => {
    // If we have 2 selected cards, check for a match
    if (selectedCards.length === 2) {
      const [firstCardId, secondCardId] = selectedCards
      const firstCard = cards.find((card) => card.id === firstCardId)
      const secondCard = cards.find((card) => card.id === secondCardId)

      // Set a timeout to prevent immediate state updates that could cause infinite loops
      const timeoutId = setTimeout(() => {
        setMoves((prevMoves) => prevMoves + 1)

        if (firstCard && secondCard && firstCard.wordId === secondCard.wordId && firstCardId !== secondCardId) {
          // Match found - show green highlight first
          setCards((prevCards) =>
            prevCards.map((card) =>
              card.id === firstCardId || card.id === secondCardId ? { ...card, isCorrectMatch: true } : card,
            ),
          )

          // Then after a short delay, mark as matched (which will make them disappear)
          setTimeout(() => {
            setCards((prevCards) =>
              prevCards.map((card) =>
                card.id === firstCardId || card.id === secondCardId
                  ? { ...card, isMatched: true, isCorrectMatch: false, isSelected: false }
                  : card,
              ),
            )
            setMatchedPairs((prev) => prev + 1)
            setSelectedCards([])
          }, 400)
        } else {
          // No match - show red highlight and shake
          setCards((prevCards) =>
            prevCards.map((card) =>
              card.id === firstCardId || card.id === secondCardId ? { ...card, isIncorrectMatch: true } : card,
            ),
          )

          // Then after a delay, reset the cards
          setTimeout(() => {
            setCards((prevCards) =>
              prevCards.map((card) =>
                card.id === firstCardId || card.id === secondCardId
                  ? { ...card, isSelected: false, isIncorrectMatch: false }
                  : card,
              ),
            )
            setSelectedCards([])
          }, 600)
        }
      }, 300)

      // Clean up timeout if component unmounts or selectedCards changes
      return () => clearTimeout(timeoutId)
    }
  }, [selectedCards])

  const handleSelectSet = (id: string) => {
    setSelectedSetId(id)
    resetGame()
  }

  const startGame = () => {
    if (!selectedSetId) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn một bộ từ vựng",
        variant: "destructive",
      })
      return
    }

    const selectedSet = vocabSets.find((set) => set.id === selectedSetId)
    if (!selectedSet || selectedSet.words.length === 0) {
      toast({
        title: "Lỗi",
        description: "Bộ từ vựng này không có từ nào",
        variant: "destructive",
      })
      return
    }

    // Filter words that have at least 2 translations
    const validWords = selectedSet.words.filter((word) => {
      const translationCount = Object.keys(word.translations || {}).length
      return translationCount >= 2
    })

    if (validWords.length === 0) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy từ nào có ít nhất 2 nghĩa",
        variant: "destructive",
      })
      return
    }

    // Shuffle and select up to 10 words
    const shuffledWords = [...validWords].sort(() => Math.random() - 0.5)
    const selectedWords = shuffledWords.slice(0, Math.min(10, shuffledWords.length))

    // Create pairs of cards
    const gamePairs: MatchingCard[] = []

    selectedWords.forEach((word) => {
      // Get all available translations
      const availableLanguages = Object.keys(word.translations || {})

      if (availableLanguages.length < 2) return

      // Randomly select 2 languages
      const shuffledLanguages = [...availableLanguages].sort(() => Math.random() - 0.5)
      const selectedLanguages = shuffledLanguages.slice(0, 2)

      // Create a card for each selected language
      selectedLanguages.forEach((language) => {
        gamePairs.push({
          id: `${word.id}-${language}`,
          wordId: word.id,
          text: word.translations[language],
          language,
          isSelected: false,
          isMatched: false,
          isCorrectMatch: false,
          isIncorrectMatch: false,
        })
      })
    })

    // Shuffle the cards
    const shuffledCards = [...gamePairs].sort(() => Math.random() - 0.5)

    setCards(shuffledCards)
    setTotalPairs(selectedWords.length)
    setMatchedPairs(0)
    setSelectedCards([])
    setMoves(0)
    setTimer(0)
    setIsPlaying(true)
    setGameCompleted(false)
  }

  const resetGame = () => {
    setCards([])
    setSelectedCards([])
    setMatchedPairs(0)
    setTotalPairs(0)
    setMoves(0)
    setTimer(0)
    setIsPlaying(false)
    setGameCompleted(false)

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }

  const handleCardClick = (cardId: string) => {
    // Ignore clicks if game is not playing or if we already have 2 selected cards
    if (!isPlaying || selectedCards.length >= 2) return

    // Find the clicked card
    const clickedCard = cards.find((card) => card.id === cardId)

    // Ignore if card is already selected or matched
    if (!clickedCard || clickedCard.isSelected || clickedCard.isMatched) return

    // Select the card
    setCards((prevCards) => prevCards.map((card) => (card.id === cardId ? { ...card, isSelected: true } : card)))

    // Add to selected cards
    setSelectedCards((prev) => [...prev, cardId])
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  const languages = [
    { value: "english", label: "English" },
    { value: "vietnamese", label: "Vietnamese" },
    { value: "japanese", label: "Japanese" },
    { value: "french", label: "French" },
    { value: "spanish", label: "Spanish" },
    { value: "german", label: "German" },
    { value: "chinese", label: "Chinese" },
    { value: "korean", label: "Korean" },
    { value: "russian", label: "Russian" },
  ]

  const getLanguageLabel = (code: string) => {
    const language = languages.find((l) => l.value === code)
    return language ? language.label : code
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-6 text-primary">Trò chơi ghép thẻ</h1>

      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <Link href="/">
          <Button variant="nav-pink" size="sm" className="rounded-full">
            Home
          </Button>
        </Link>
        <Link href="/vocabulary">
          <Button variant="nav-green" size="sm" className="rounded-full">
            Vocabulary
          </Button>
        </Link>
        <Link href="/flashcards">
          <Button variant="nav-blue" size="sm" className="rounded-full">
            Flashcards
          </Button>
        </Link>
        <Link href="/quiz">
          <Button variant="nav-purple" size="sm" className="rounded-full">
            Quiz
          </Button>
        </Link>
        <Link href="/matching">
          <Button variant="nav-yellow" size="sm" className="rounded-full">
            Matching
          </Button>
        </Link>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
        <div className="w-full sm:w-1/2">
          <Select value={selectedSetId || ""} onValueChange={handleSelectSet}>
            <SelectTrigger className="border-primary/20 focus:border-primary rounded-full">
              <SelectValue placeholder="Chọn bộ từ vựng" />
            </SelectTrigger>
            <SelectContent>
              {vocabSets.map((set) => (
                <SelectItem key={set.id} value={set.id}>
                  {set.name} ({set.words.length} từ)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            onClick={startGame}
            disabled={!selectedSetId || isPlaying}
            className="rounded-full flex-1 sm:flex-none"
          >
            <Sparkles className="mr-2 h-4 w-4" /> Bắt đầu
          </Button>

          <Button
            variant="outline"
            onClick={resetGame}
            disabled={!isPlaying && !gameCompleted}
            className="rounded-full flex-1 sm:flex-none"
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Làm lại
          </Button>
        </div>
      </div>

      {/* Game stats */}
      {(isPlaying || gameCompleted) && (
        <div className="flex flex-wrap justify-between items-center mb-4 p-3 bg-secondary/50 rounded-lg border border-primary/20">
          <div className="flex items-center text-primary/80">
            <Clock className="h-4 w-4 mr-1" /> Thời gian: {formatTime(timer)}
          </div>
          <div className="flex items-center text-primary/80">
            <Shuffle className="h-4 w-4 mr-1" /> Lượt: {moves}
          </div>
          <div className="flex items-center text-primary/80">
            <Trophy className="h-4 w-4 mr-1" /> Tiến độ: {matchedPairs}/{totalPairs}
          </div>
        </div>
      )}

      {/* Game board */}
      <div
        ref={containerRef}
        className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6 ${
          !isPlaying && !gameCompleted ? "opacity-50" : ""
        }`}
      >
        {cards.map((card) => (
          <div
            key={card.id}
            className={`cursor-pointer ${card.isMatched ? "opacity-0 pointer-events-none transition-opacity duration-1000" : ""}`}
            onClick={() => handleCardClick(card.id)}
          >
            <Card
              className={`w-full h-24 flex flex-col items-center justify-center p-2 transition-all duration-300 
                ${card.isCorrectMatch ? "bg-green-100 border-green-500 border-2 shadow-lg" : ""}
                ${card.isIncorrectMatch ? "bg-red-100 border-red-500 border-2 shadow-lg animate-shake" : ""}
                ${
                  card.isSelected && !card.isCorrectMatch && !card.isIncorrectMatch
                    ? "border-primary border-2 shadow-lg bg-primary/5"
                    : (!card.isCorrectMatch && !card.isIncorrectMatch)
                      ? "border-primary/20 hover:border-primary/40 hover:shadow-md bg-white"
                      : ""
                }
              `}
            >
              <div className="text-xs text-primary/60 mb-1">{getLanguageLabel(card.language)}</div>
              <div className="text-center font-medium">{card.text}</div>
            </Card>
          </div>
        ))}
      </div>

      {/* Game completion message */}
      {gameCompleted && (
        <div className="text-center p-6 bg-gradient-to-br from-primary/5 to-primary/20 rounded-lg border border-primary/20 animate-fade-in">
          <h2 className="text-2xl font-bold text-primary mb-2">Chúc mừng! 🎉</h2>
          <p className="mb-4">Bạn đã hoàn thành trò chơi!</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="text-sm text-primary/60">Thời gian</div>
              <div className="text-xl font-bold">{formatTime(timer)}</div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="text-sm text-primary/60">Số lượt</div>
              <div className="text-xl font-bold">{moves}</div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="text-sm text-primary/60">Cặp thẻ</div>
              <div className="text-xl font-bold">{matchedPairs}</div>
            </div>
          </div>

          <Button onClick={startGame} className="rounded-full">
            <Sparkles className="mr-2 h-4 w-4" /> Chơi lại
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!isPlaying && !gameCompleted && cards.length === 0 && (
        <div className="text-center py-12 border border-primary/20 rounded-lg bg-secondary/50">
          <Shuffle className="h-12 w-12 mx-auto text-primary/40 mb-4" />
          <h3 className="text-lg font-medium">Ghép thẻ từ vựng</h3>
          <p className="text-muted-foreground mt-2 mb-4 max-w-md mx-auto">
            Chọn một bộ từ vựng và bắt đầu trò chơi. Tìm và ghép các thẻ có cùng nghĩa để hoàn thành trò chơi.
          </p>
          <Button onClick={startGame} disabled={!selectedSetId} className="rounded-full">
            <Sparkles className="mr-2 h-4 w-4" /> Bắt đầu trò chơi
          </Button>
        </div>
      )}
    </div>
  )
}
