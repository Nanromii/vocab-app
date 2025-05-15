"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { RefreshCw, Check, X, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import type { VocabSet } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import confetti from "canvas-confetti"

// Define the shape of a puzzle piece
type PuzzlePiece = {
  id: string
  shape: boolean[][]
  color: string
}

// Define the word challenge
type WordChallenge = {
  wordId: string
  questionText: string
  questionLanguage: string
  correctAnswers: { language: string; text: string }[]
  attempts: number
}

// Define the position for dragging
type Position = {
  x: number
  y: number
}

// Define game states
type GameState = "answering" | "placing" | "gameOver"

const GRID_SIZE = 9
const MAX_ATTEMPTS = 3
const POINTS_PER_LINE = 10

const COLORS = [
  "bg-pink-400",
  "bg-purple-400",
  "bg-blue-400",
  "bg-green-400",
  "bg-yellow-400",
  "bg-orange-400",
  "bg-red-400",
  "bg-indigo-400",
  "bg-teal-400",
]

// Predefined shapes for puzzle pieces (each is a 2D array representing the shape)
const PIECE_SHAPES = [
  // 1x1
  [[true]],

  // 2x1
  [[true, true]],

  // 1x2
  [[true], [true]],

  // 2x2
  [
    [true, true],
    [true, true],
  ],

  // L shapes
  [
    [true, false],
    [true, true],
  ],
  [
    [false, true],
    [true, true],
  ],
  [
    [true, true],
    [true, false],
  ],
  [
    [true, true],
    [false, true],
  ],

  // T shapes
  [
    [true, true, true],
    [false, true, false],
  ],
  [
    [false, true],
    [true, true],
    [false, true],
  ],
  [
    [false, true, false],
    [true, true, true],
  ],
  [
    [true, false],
    [true, true],
    [true, false],
  ],

  // Z shapes
  [
    [true, true, false],
    [false, true, true],
  ],
  [
    [false, true],
    [true, true],
    [true, false],
  ],

  // Line shapes
  [[true, true, true]],
  [[true], [true], [true]],

  // Special shapes
  [
    [true, true, true],
    [true, false, false],
    [true, false, false],
  ],
  [
    [true, true, true],
    [false, false, true],
    [false, false, true],
  ],
  [
    [true, false, false],
    [true, false, false],
    [true, true, true],
  ],
  [
    [false, false, true],
    [false, false, true],
    [true, true, true],
  ],
]

export default function PuzzleGamePage() {
  const { toast } = useToast()
  const [vocabSets, setVocabSets] = useState<VocabSet[]>([])
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [gameState, setGameState] = useState<GameState>("answering")
  const [score, setScore] = useState(0)
  const [correctWords, setCorrectWords] = useState(0)
  const [grid, setGrid] = useState<(string | null)[][]>(
    Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(null)),
  )
  const [availablePieces, setAvailablePieces] = useState<PuzzlePiece[]>([])
  const [currentWord, setCurrentWord] = useState<WordChallenge | null>(null)
  const [userAnswer, setUserAnswer] = useState("")
  const [showingAnswer, setShowingAnswer] = useState(false)

  // Drag and drop state
  const [draggedPiece, setDraggedPiece] = useState<number | null>(null)
  const [dragPosition, setDragPosition] = useState<Position | null>(null)
  const [dropPosition, setDropPosition] = useState<{ row: number; col: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const boardRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const piecesContainerRef = useRef<HTMLDivElement>(null)

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

  // Check for game over condition
  useEffect(() => {
    if (isPlaying && gameState === "placing" && availablePieces.length > 0 && !canPlaceAnyPiece()) {
      endGame()
    }
  }, [isPlaying, gameState, availablePieces, grid])

  // Check if all pieces have been placed and we need to show a new word
  useEffect(() => {
    if (isPlaying && gameState === "placing" && availablePieces.length === 0) {
      // All pieces have been placed, show a new word challenge
      setGameState("answering")
      generateWordChallenge()
    }
  }, [isPlaying, gameState, availablePieces])

  // Generate a new word challenge when needed
  useEffect(() => {
    if (isPlaying && gameState === "answering" && !currentWord) {
      generateWordChallenge()
    }
  }, [isPlaying, gameState, currentWord])

  // Add global mouse event listeners for drag and drop
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && draggedPiece !== null) {
        setDragPosition({ x: e.clientX, y: e.clientY })

        // Calculate drop position on the grid
        if (boardRef.current) {
          const boardRect = boardRef.current.getBoundingClientRect()
          const cellSize = boardRect.width / GRID_SIZE

          // Check if mouse is over the board
          if (
            e.clientX >= boardRect.left &&
            e.clientX <= boardRect.right &&
            e.clientY >= boardRect.top &&
            e.clientY <= boardRect.bottom
          ) {
            const col = Math.floor((e.clientX - boardRect.left) / cellSize)
            const row = Math.floor((e.clientY - boardRect.top) / cellSize)

            if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
              setDropPosition({ row, col })
            } else {
              setDropPosition(null)
            }
          } else {
            setDropPosition(null)
          }
        }
      }
    }

    const handleMouseUp = () => {
      if (isDragging && draggedPiece !== null && dropPosition) {
        // Try to place the piece
        placePiece(draggedPiece, dropPosition.row, dropPosition.col)
      }

      // Reset drag state
      setIsDragging(false)
      setDraggedPiece(null)
      setDragPosition(null)
      setDropPosition(null)
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, draggedPiece, dropPosition])

  // Handle successful confetti effect
  const triggerSuccessEffect = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const x = rect.left + rect.width / 2
      const y = rect.top + rect.height / 2

      confetti({
        particleCount: 50,
        spread: 70,
        origin: {
          x: x / window.innerWidth,
          y: y / window.innerHeight,
        },
        colors: ["#9c27b0", "#ba68c8", "#e1bee7", "#8e24aa", "#7b1fa2"],
      })
    }
  }

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

    // Initialize game state
    setGrid(
      Array(GRID_SIZE)
        .fill(null)
        .map(() => Array(GRID_SIZE).fill(null)),
    )
    setAvailablePieces([])
    setCurrentWord(null)
    setScore(0)
    setCorrectWords(0)
    setGameState("answering")
    setIsPlaying(true)
    setShowingAnswer(false)

    // Start with a word challenge
    generateWordChallenge()
  }

  const resetGame = () => {
    setGrid(
      Array(GRID_SIZE)
        .fill(null)
        .map(() => Array(GRID_SIZE).fill(null)),
    )
    setAvailablePieces([])
    setCurrentWord(null)
    setScore(0)
    setCorrectWords(0)
    setGameState("answering")
    setIsPlaying(false)
    setShowingAnswer(false)
  }

  const endGame = () => {
    setGameState("gameOver")
    setIsPlaying(false)

    toast({
      title: "Game Over!",
      description: `Điểm của bạn: ${score}, Số từ đúng: ${correctWords}`,
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

  // Generate 3 new random puzzle pieces
  const generateNewPieces = () => {
    const newPieces: PuzzlePiece[] = []

    for (let i = 0; i < 3; i++) {
      const randomShapeIndex = Math.floor(Math.random() * PIECE_SHAPES.length)
      const randomColorIndex = Math.floor(Math.random() * COLORS.length)

      newPieces.push({
        id: `piece-${Date.now()}-${i}-${Math.random()}`,
        shape: PIECE_SHAPES[randomShapeIndex],
        color: COLORS[randomColorIndex],
      })
    }

    setAvailablePieces(newPieces) // Replace any existing pieces
    setGameState("placing") // Switch to placing mode
  }

  // Generate a new word challenge
  const generateWordChallenge = () => {
    const selectedSet = vocabSets.find((set) => set.id === selectedSetId)
    if (!selectedSet || selectedSet.words.length === 0) return

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
      endGame()
      return
    }

    // Select a random word
    const randomWord = validWords[Math.floor(Math.random() * validWords.length)]

    // Get all available languages for this word
    const availableLanguages = Object.keys(randomWord.translations || {})

    // Randomly select one language for the question
    const questionLanguage = availableLanguages[Math.floor(Math.random() * availableLanguages.length)]
    const questionText = randomWord.translations[questionLanguage]

    // All other translations are correct answers
    const correctAnswers = availableLanguages
      .filter((lang) => lang !== questionLanguage)
      .map((lang) => ({
        language: lang,
        text: randomWord.translations[lang],
      }))

    setCurrentWord({
      wordId: randomWord.id,
      questionText,
      questionLanguage,
      correctAnswers,
      attempts: 0,
    })

    setUserAnswer("")
    setShowingAnswer(false)
  }

  // Check if the user's answer is correct
  const checkAnswer = () => {
    if (!currentWord) return

    // Check if the answer is correct (case insensitive)
    const isCorrect = currentWord.correctAnswers.some(
      (answer) => userAnswer.toLowerCase() === answer.text.toLowerCase(),
    )

    if (isCorrect) {
      // Correct answer
      setCorrectWords(correctWords + 1)
      setCurrentWord(null)
      setUserAnswer("")

      // Generate new pieces as a reward
      generateNewPieces()

      toast({
        title: "Chính xác!",
        description: "Bạn đã trả lời đúng và nhận được 3 mảnh ghép mới!",
      })

      triggerSuccessEffect()
    } else {
      // Wrong answer
      const newAttempts = currentWord.attempts + 1

      if (newAttempts >= MAX_ATTEMPTS) {
        // Show correct answers after max attempts
        setShowingAnswer(true)

        setTimeout(() => {
          setCurrentWord(null)
          setUserAnswer("")
          setShowingAnswer(false)
        }, 3000)

        toast({
          title: "Hết lượt",
          description: "Đã hiển thị đáp án đúng",
          variant: "destructive",
        })
      } else {
        setCurrentWord({
          ...currentWord,
          attempts: newAttempts,
        })

        toast({
          title: "Sai rồi",
          description: `Còn ${MAX_ATTEMPTS - newAttempts} lượt thử`,
          variant: "destructive",
        })
      }
    }
  }

  // Skip the current word
  const skipWord = () => {
    setCurrentWord(null)
    setUserAnswer("")
    setShowingAnswer(false)

    toast({
      title: "Đã bỏ qua",
      description: "Đang chọn từ mới...",
    })
  }

  // Check if a piece can be placed at a specific position
  const canPlacePiece = (piece: PuzzlePiece, row: number, col: number): boolean => {
    const pieceHeight = piece.shape.length
    const pieceWidth = piece.shape[0].length

    // Check if piece is out of bounds
    if (row + pieceHeight > GRID_SIZE || col + pieceWidth > GRID_SIZE) {
      return false
    }

    // Check if all cells required by the piece are empty
    for (let r = 0; r < pieceHeight; r++) {
      for (let c = 0; c < pieceWidth; c++) {
        if (piece.shape[r][c] && grid[row + r][col + c] !== null) {
          return false
        }
      }
    }

    return true
  }

  // Check if any piece can be placed on the board
  const canPlaceAnyPiece = (): boolean => {
    for (const piece of availablePieces) {
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          if (canPlacePiece(piece, row, col)) {
            return true
          }
        }
      }
    }
    return false
  }

  // Place a piece on the board
  const placePiece = (pieceIndex: number, row: number, col: number) => {
    if (pieceIndex === null || pieceIndex >= availablePieces.length) return

    const piece = availablePieces[pieceIndex]
    if (!canPlacePiece(piece, row, col)) return

    // Create a copy of the grid
    const newGrid = grid.map((row) => [...row])

    // Place the piece on the grid
    const pieceHeight = piece.shape.length
    const pieceWidth = piece.shape[0].length

    for (let r = 0; r < pieceHeight; r++) {
      for (let c = 0; c < pieceWidth; c++) {
        if (piece.shape[r][c]) {
          newGrid[row + r][col + c] = piece.color
        }
      }
    }

    // Update the grid
    setGrid(newGrid)

    // Remove the piece from available pieces
    const newAvailablePieces = [...availablePieces]
    newAvailablePieces.splice(pieceIndex, 1)
    setAvailablePieces(newAvailablePieces)

    // Check for completed rows and columns
    checkCompletedLines(newGrid)
  }

  // Check for completed rows and columns
  const checkCompletedLines = (currentGrid: (string | null)[][]) => {
    const newGrid = [...currentGrid.map((row) => [...row])]
    let completedLines = 0

    // Check rows
    for (let row = 0; row < GRID_SIZE; row++) {
      if (newGrid[row].every((cell) => cell !== null)) {
        // Clear the row
        newGrid[row] = Array(GRID_SIZE).fill(null)
        completedLines++
      }
    }

    // Check columns
    for (let col = 0; col < GRID_SIZE; col++) {
      if (newGrid.every((row) => row[col] !== null)) {
        // Clear the column
        for (let row = 0; row < GRID_SIZE; row++) {
          newGrid[row][col] = null
        }
        completedLines++
      }
    }

    // Update score and grid if any lines were completed
    if (completedLines > 0) {
      const pointsEarned = completedLines * POINTS_PER_LINE
      setScore(score + pointsEarned)
      setGrid(newGrid)

      toast({
        title: "Hoàn thành!",
        description: `+${pointsEarned} điểm cho ${completedLines} hàng/cột`,
      })

      triggerSuccessEffect()
    }
  }

  // Start dragging a piece
  const handlePieceDragStart = (index: number, e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDraggedPiece(index)
    setDragPosition({ x: e.clientX, y: e.clientY })
  }

  // Get the languages list
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

  // Render a piece preview
  const renderPiecePreview = (piece: PuzzlePiece, index: number) => {
    const pieceHeight = piece.shape.length
    const pieceWidth = piece.shape[0].length
    const isDraggingThis = isDragging && draggedPiece === index

    return (
      <div
        key={piece.id}
        className={`relative cursor-grab border-2 ${
          isDraggingThis ? "opacity-50 border-transparent" : "border-primary/20 hover:border-primary"
        } p-1 rounded-md m-1`}
        onMouseDown={(e) => handlePieceDragStart(index, e)}
      >
        <div
          className="grid gap-0.5"
          style={{
            gridTemplateRows: `repeat(${pieceHeight}, 1fr)`,
            gridTemplateColumns: `repeat(${pieceWidth}, 1fr)`,
          }}
        >
          {piece.shape.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`w-6 h-6 rounded-sm ${cell ? piece.color : "bg-transparent"}`}
              />
            )),
          )}
        </div>
      </div>
    )
  }

  // Render the dragged piece
  const renderDraggedPiece = () => {
    if (!isDragging || draggedPiece === null || dragPosition === null) return null

    const piece = availablePieces[draggedPiece]
    const pieceHeight = piece.shape.length
    const pieceWidth = piece.shape[0].length

    // Calculate cell size based on the board size
    let cellSize = 30 // Default size
    if (boardRef.current) {
      const boardRect = boardRef.current.getBoundingClientRect()
      cellSize = boardRect.width / GRID_SIZE
    }

    // Calculate the offset to center the piece on the cursor
    const offsetX = (pieceWidth * cellSize) / 2
    const offsetY = (pieceHeight * cellSize) / 2

    return (
      <div
        className="fixed pointer-events-none z-50"
        style={{
          left: `${dragPosition.x - offsetX}px`,
          top: `${dragPosition.y - offsetY}px`,
        }}
      >
        <div
          className="grid gap-0.5"
          style={{
            gridTemplateRows: `repeat(${pieceHeight}, 1fr)`,
            gridTemplateColumns: `repeat(${pieceWidth}, 1fr)`,
          }}
        >
          {piece.shape.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <div
                key={`drag-${rowIndex}-${colIndex}`}
                className={`rounded-sm ${cell ? piece.color : "bg-transparent"}`}
                style={{ width: `${cellSize - 2}px`, height: `${cellSize - 2}px` }}
              />
            )),
          )}
        </div>
      </div>
    )
  }

  // Render the drop preview
  const renderDropPreview = () => {
    if (!isDragging || draggedPiece === null || dropPosition === null) return null

    const piece = availablePieces[draggedPiece]
    const pieceHeight = piece.shape.length
    const pieceWidth = piece.shape[0].length
    const canPlace = canPlacePiece(piece, dropPosition.row, dropPosition.col)

    // Create a preview grid
    const previewGrid = grid.map((row) => [...row])

    if (canPlace) {
      for (let r = 0; r < pieceHeight; r++) {
        for (let c = 0; c < pieceWidth; c++) {
          if (piece.shape[r][c]) {
            if (dropPosition.row + r < GRID_SIZE && dropPosition.col + c < GRID_SIZE) {
              previewGrid[dropPosition.row + r][dropPosition.col + c] = "preview"
            }
          }
        }
      }
    }

    return (
      <div className="absolute inset-0 pointer-events-none">
        <div className="grid grid-cols-9 gap-0.5 h-full w-full">
          {previewGrid.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              if (cell === "preview") {
                return (
                  <div
                    key={`preview-${rowIndex}-${colIndex}`}
                    className={`${canPlace ? "bg-green-200 border border-green-400" : "bg-red-200 border border-red-400"} rounded-sm`}
                  />
                )
              }
              return <div key={`preview-${rowIndex}-${colIndex}`} className="rounded-sm" />
            }),
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4" ref={containerRef}>
      <h1 className="text-3xl font-bold mb-6 text-primary">Trò chơi Xếp Hình Từ Vựng</h1>

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

      {!isPlaying && gameState !== "gameOver" ? (
        <Card className="border-primary/20 mb-6">
          <CardHeader>
            <CardTitle className="text-primary">Bắt đầu trò chơi Xếp Hình</CardTitle>
            <CardDescription>
              Trả lời đúng các câu hỏi từ vựng để nhận mảnh ghép. Kéo và thả các mảnh ghép vào bảng 9x9. Khi một hàng
              hoặc cột được lấp đầy, bạn sẽ được cộng điểm.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
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
          </CardContent>
          <CardFooter>
            <Button onClick={startGame} disabled={!selectedSetId} className="w-full rounded-full">
              <Sparkles className="mr-2 h-4 w-4" /> Bắt đầu trò chơi
            </Button>
          </CardFooter>
        </Card>
      ) : gameState === "gameOver" ? (
        <Card className="border-primary/20 mb-6">
          <CardHeader>
            <CardTitle className="text-primary">Game Over!</CardTitle>
            <CardDescription>Không thể đặt thêm mảnh ghép nào vào bảng.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="bg-secondary/30 p-3 rounded-lg shadow-sm">
                <div className="text-sm text-primary/60">Điểm số</div>
                <div className="text-3xl font-bold">{score}</div>
              </div>
              <div className="bg-secondary/30 p-3 rounded-lg shadow-sm">
                <div className="text-sm text-primary/60">Số từ đúng</div>
                <div className="text-3xl font-bold">{correctWords}</div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={startGame} className="w-full rounded-full">
              <Sparkles className="mr-2 h-4 w-4" /> Chơi lại
            </Button>
          </CardFooter>
        </Card>
      ) : null}

      {isPlaying && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game board */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <div className="text-lg font-bold">Điểm: {score}</div>
              <div className="text-lg font-bold">Từ đúng: {correctWords}</div>
            </div>

            <div
              ref={boardRef}
              className="grid grid-cols-9 gap-0.5 bg-gray-200 p-1 rounded-lg border-2 border-primary/20 relative"
            >
              {grid.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`w-full aspect-square rounded-sm ${cell || "bg-white"}`}
                  />
                )),
              )}
              {renderDropPreview()}
            </div>
          </div>

          {/* Game controls */}
          <div className="space-y-6">
            {gameState === "answering" && currentWord ? (
              <Card className="border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-primary text-lg">Dịch từ này</CardTitle>
                  <CardDescription>
                    Nhập một nghĩa khác của từ này ({MAX_ATTEMPTS - currentWord.attempts} lượt còn lại)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-secondary/30 p-3 rounded-lg">
                    <div className="text-sm text-primary/60 mb-1">
                      {getLanguageLabel(currentWord.questionLanguage)}:
                    </div>
                    <div className="text-xl font-bold">{currentWord.questionText}</div>
                  </div>

                  {showingAnswer ? (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Đáp án đúng:</div>
                      {currentWord.correctAnswers.map((answer, index) => (
                        <div key={index} className="bg-green-100 p-2 rounded-md">
                          <span className="text-sm text-green-700">{getLanguageLabel(answer.language)}: </span>
                          <span className="font-medium">{answer.text}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Nhập nghĩa của từ..."
                        className="border-primary/20 focus:border-primary"
                      />
                      <div className="flex gap-2">
                        <Button onClick={checkAnswer} disabled={!userAnswer.trim()} className="flex-1 rounded-full">
                          <Check className="mr-2 h-4 w-4" /> Kiểm tra
                        </Button>
                        <Button variant="outline" onClick={skipWord} className="rounded-full">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : gameState === "placing" ? (
              <Card className="border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-primary text-lg">Mảnh ghép</CardTitle>
                  <CardDescription>
                    Kéo và thả {availablePieces.length} mảnh ghép vào bảng. Sau khi đặt hết, bạn sẽ nhận được câu hỏi
                    mới.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div ref={piecesContainerRef} className="flex flex-wrap gap-4 justify-center">
                    {availablePieces.map((piece, index) => renderPiecePreview(piece, index))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" onClick={() => endGame()} className="w-full rounded-full">
                    <X className="mr-2 h-4 w-4" /> Kết thúc
                  </Button>
                </CardFooter>
              </Card>
            ) : null}
          </div>
        </div>
      )}

      {/* Dragged piece overlay */}
      {renderDraggedPiece()}
    </div>
  )
}
