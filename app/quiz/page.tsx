"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Check, X, RotateCcw, Sparkles, SmilePlus, Smile, Meh, Frown, FolderOpenIcon as FrownOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { VocabSet } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

type QuizQuestion = {
  id: string
  questionLanguage: string
  questionText: string
  correctAnswers: { language: string; text: string }[]
  userAnswer?: string
  isCorrect?: boolean
}

export default function QuizPage() {
  const { toast } = useToast()
  const [vocabSets, setVocabSets] = useState<VocabSet[]>([])
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null)
  const [questionCount, setQuestionCount] = useState(10)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [quizStarted, setQuizStarted] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [currentAnswer, setCurrentAnswer] = useState("")
  const [score, setScore] = useState(0)
  const [inputError, setInputError] = useState<string | null>(null)

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

  const handleSelectSet = (id: string) => {
    setSelectedSetId(id)
    setQuizStarted(false)
    setQuizCompleted(false)
    setQuestions([])
  }

  const handleQuestionCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow empty input temporarily for better UX
    if (e.target.value === "") {
      setQuestionCount(0)
      setInputError(null)
      return
    }

    const value = Number.parseInt(e.target.value)
    if (!isNaN(value)) {
      setQuestionCount(value)

      // Validate the input range
      if (value < 1 || value > 100) {
        setInputError("Hãy nhập các số từ 1 -> 100")
      } else {
        setInputError(null)
      }
    }
  }

  const generateQuiz = () => {
    // Validate input before generating quiz
    if (questionCount < 1 || questionCount > 100) {
      setInputError("Hãy nhập các số từ 1 -> 100")
      return
    }

    if (!selectedSetId) {
      toast({
        title: "Error",
        description: "Please select a vocabulary set",
        variant: "destructive",
      })
      return
    }

    const selectedSet = vocabSets.find((set) => set.id === selectedSetId)
    if (!selectedSet || selectedSet.words.length === 0) {
      toast({
        title: "Error",
        description: "The selected set has no words",
        variant: "destructive",
      })
      return
    }

    if (selectedSet.words.length < questionCount) {
      toast({
        title: "Warning",
        description: `This set only has ${selectedSet.words.length} words. Generating quiz with all available words.`,
      })
    }

    // Filter words that have at least two translations
    const validWords = selectedSet.words.filter((word) => {
      const translationCount = Object.keys(word.translations || {}).length
      return translationCount >= 2
    })

    if (validWords.length === 0) {
      toast({
        title: "Error",
        description: "This set doesn't have any words with multiple translations. Add more translations first.",
        variant: "destructive",
      })
      return
    }

    // Shuffle and select words for the quiz
    const shuffledWords = [...validWords].sort(() => Math.random() - 0.5)
    const selectedWords = shuffledWords.slice(0, Math.min(questionCount, shuffledWords.length))

    // Generate questions
    const newQuestions: QuizQuestion[] = selectedWords.map((word) => {
      // Get all languages that have translations for this word
      const availableLanguages = Object.keys(word.translations || {})

      // Randomly select one language for the question
      const questionLanguage = availableLanguages[Math.floor(Math.random() * availableLanguages.length)]
      const questionText = word.translations[questionLanguage]

      // All other translations are correct answers
      const correctAnswers = availableLanguages
        .filter((lang) => lang !== questionLanguage)
        .map((lang) => ({
          language: lang,
          text: word.translations[lang],
        }))

      return {
        id: word.id,
        questionLanguage,
        questionText,
        correctAnswers,
      }
    })

    setQuestions(newQuestions)
    setCurrentQuestionIndex(0)
    setQuizStarted(true)
    setQuizCompleted(false)
    setScore(0)
    setCurrentAnswer("")

    toast({
      title: "Quiz Generated",
      description: `${newQuestions.length} questions created. Good luck!`,
    })
  }

  const handleAnswerSubmit = () => {
    if (currentQuestionIndex >= questions.length) return

    const currentQuestion = questions[currentQuestionIndex]

    // Check if the answer is correct (case insensitive)
    const isCorrect = currentQuestion.correctAnswers.some(
      (answer) => currentAnswer.toLowerCase() === answer.text.toLowerCase(),
    )

    // Update question with user's answer
    const updatedQuestions = [...questions]
    updatedQuestions[currentQuestionIndex] = {
      ...currentQuestion,
      userAnswer: currentAnswer,
      isCorrect,
    }

    setQuestions(updatedQuestions)

    // Update score
    if (isCorrect) {
      setScore(score + 1)
    }

    // Move to next question or complete quiz
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setCurrentAnswer("")
    } else {
      setQuizCompleted(true)
      toast({
        title: "Quiz Completed",
        description: `Your score: ${score + (isCorrect ? 1 : 0)}/${questions.length}`,
      })
    }
  }

  const handleWriteAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentAnswer(e.target.value)
  }

  const restartQuiz = () => {
    setCurrentQuestionIndex(0)
    setQuizCompleted(false)
    setScore(0)
    setCurrentAnswer("")

    // Reset all user answers
    const resetQuestions = questions.map((q) => ({
      ...q,
      userAnswer: undefined,
      isCorrect: undefined,
    }))

    setQuestions(resetQuestions)

    toast({
      title: "Quiz Restarted",
      description: "Good luck!",
    })
  }

  const selectedSet = vocabSets.find((set) => set.id === selectedSetId)
  const currentQuestion = questions[currentQuestionIndex]
  const maxQuestionCount = selectedSet?.words.length || 10

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

  // Function to get the appropriate emoji based on score percentage
  const getScoreEmoji = (scorePercent: number) => {
    if (scorePercent >= 90) {
      return {
        icon: <SmilePlus className="emoji-bounce" />,
        text: "Tuyệt vời!",
        color: "text-green-500",
        bgColor: "bg-green-100",
        borderColor: "border-green-200",
      }
    } else if (scorePercent >= 70) {
      return {
        icon: <Smile className="emoji-pulse" />,
        text: "Rất tốt!",
        color: "text-emerald-500",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
      }
    } else if (scorePercent >= 50) {
      return {
        icon: <Meh className="emoji-wiggle" />,
        text: "Khá tốt",
        color: "text-amber-500",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
      }
    } else if (scorePercent >= 30) {
      return {
        icon: <Frown className="emoji-shake" />,
        text: "Cần cố gắng hơn",
        color: "text-orange-500",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
      }
    } else {
      return {
        icon: <FrownOpen className="emoji-tear" />,
        text: "Hãy tiếp tục luyện tập",
        color: "text-red-500",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
      }
    }
  }

  // Calculate score percentage
  const scorePercent = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0
  const scoreEmoji = getScoreEmoji(scorePercent)

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-6 text-primary">Quiz</h1>

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
        <Link href="/matching">
          <Button variant="nav-yellow" size="sm" className="rounded-full">
            Matching
          </Button>
        </Link>
      </div>

      {!quizStarted ? (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary">Create a Quiz</CardTitle>
            <CardDescription>Generate a random quiz from your vocabulary sets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vocab-set" className="text-primary/80">
                Vocabulary Set
              </Label>
              <Select value={selectedSetId || ""} onValueChange={handleSelectSet}>
                <SelectTrigger id="vocab-set" className="border-primary/20 focus:border-primary rounded-full">
                  <SelectValue placeholder="Select a vocabulary set" />
                </SelectTrigger>
                <SelectContent>
                  {vocabSets.map((set) => (
                    <SelectItem key={set.id} value={set.id}>
                      {set.name} ({set.words.length} words)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="question-count" className="text-primary/80">
                Number of Questions
              </Label>
              <Input
                id="question-count"
                type="number"
                min="1"
                max="100"
                value={questionCount || ""}
                onChange={handleQuestionCountChange}
                placeholder="Enter number of questions"
                className={`border-primary/20 focus:border-primary rounded-full ${
                  inputError ? "border-destructive" : ""
                }`}
              />
              {inputError && <p className="text-sm text-destructive mt-1">{inputError}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={generateQuiz} className="w-full rounded-full" disabled={!!inputError || !selectedSetId}>
              <Sparkles className="mr-2 h-4 w-4" /> Generate Quiz
            </Button>
          </CardFooter>
        </Card>
      ) : quizCompleted ? (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary">Quiz Results</CardTitle>
            <CardDescription>
              You scored {score} out of {questions.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Score display with emoji */}
              <div className="flex flex-col items-center justify-center">
                <div className={`text-6xl font-bold ${scoreEmoji.color}`}>{scorePercent}%</div>

                <div
                  className={`mt-4 p-6 rounded-full ${scoreEmoji.bgColor} border ${scoreEmoji.borderColor} flex flex-col items-center justify-center transition-all duration-300 hover:scale-110`}
                >
                  <div className="text-5xl mb-2">{scoreEmoji.icon}</div>
                  <div className={`text-lg font-medium ${scoreEmoji.color}`}>{scoreEmoji.text}</div>
                </div>

                <div className="mt-4 text-center text-muted-foreground">
                  {scorePercent >= 70 ? (
                    <p>Bạn đã làm rất tốt! Hãy tiếp tục phát huy nhé!</p>
                  ) : scorePercent >= 40 ? (
                    <p>Bạn đang tiến bộ! Hãy tiếp tục luyện tập!</p>
                  ) : (
                    <p>Đừng nản lòng! Hãy xem lại những từ bạn chưa thuộc!</p>
                  )}
                </div>
              </div>

              <div className="border border-primary/20 rounded-lg overflow-hidden">
                <div className="grid grid-cols-[1fr_1fr_auto] font-medium bg-secondary p-3">
                  <div className="text-primary/80">Question</div>
                  <div className="text-primary/80">Your Answer</div>
                  <div className="w-10"></div>
                </div>
                {questions.map((question, index) => (
                  <div key={question.id} className="grid grid-cols-[1fr_1fr_auto] p-3 border-t border-primary/10">
                    <div>
                      <span className="text-sm text-primary/60">{getLanguageLabel(question.questionLanguage)}: </span>
                      {question.questionText}
                    </div>
                    <div>{question.userAnswer || "-"}</div>
                    <div>
                      {question.isCorrect ? (
                        <Check className="h-5 w-5 text-green-500 animate-check" />
                      ) : (
                        <div className="flex flex-col">
                          <X className="h-5 w-5 text-destructive animate-wrong" />
                          <span className="text-xs text-muted-foreground">
                            {question.correctAnswers
                              .map((answer) => `${getLanguageLabel(answer.language)}: ${answer.text}`)
                              .join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="outline" onClick={restartQuiz} className="flex-1 rounded-full">
              <RotateCcw className="mr-2 h-4 w-4" /> Restart Quiz
            </Button>
            <Button onClick={() => setQuizStarted(false)} className="flex-1 rounded-full">
              Create New Quiz
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-primary">
                Question {currentQuestionIndex + 1} of {questions.length}
              </CardTitle>
              <div className="text-sm text-muted-foreground bg-primary/10 px-3 py-1 rounded-full">
                Score: {score}/{currentQuestionIndex}
              </div>
            </div>
            <CardDescription>
              {currentQuestion && (
                <span>
                  Translate this {getLanguageLabel(currentQuestion.questionLanguage)} word to any other language
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentQuestion && (
              <div className="space-y-6">
                <div className="text-2xl font-bold text-center py-6 px-4 bg-gradient-to-br from-primary/5 to-primary/20 rounded-lg">
                  {currentQuestion.questionText}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="answer" className="text-primary/80">
                    Your Answer
                  </Label>
                  <Input
                    id="answer"
                    value={currentAnswer}
                    onChange={handleWriteAnswerChange}
                    placeholder="Type your answer..."
                    className="border-primary/20 focus:border-primary rounded-full"
                  />
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleAnswerSubmit} disabled={!currentAnswer} className="w-full rounded-full">
              <Sparkles className="mr-2 h-4 w-4" /> Submit Answer
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
