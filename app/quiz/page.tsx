"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Check, X, Shuffle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import type { VocabSet } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

type QuizQuestion = {
  id: string
  word: string
  correctAnswer: string
  options?: string[]
  userAnswer?: string
  isCorrect?: boolean
}

type QuizType = "multiple-choice" | "write-answer"

export default function QuizPage() {
  const { toast } = useToast()
  const [vocabSets, setVocabSets] = useState<VocabSet[]>([])
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null)
  const [quizType, setQuizType] = useState<QuizType>("multiple-choice")
  const [questionCount, setQuestionCount] = useState(10)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [quizStarted, setQuizStarted] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [currentAnswer, setCurrentAnswer] = useState("")
  const [score, setScore] = useState(0)

  // Load vocabulary sets from localStorage on component mount
  useEffect(() => {
    const savedSets = localStorage.getItem("vocabSets")
    if (savedSets) {
      setVocabSets(JSON.parse(savedSets))
    }
  }, [])

  const handleSelectSet = (id: string) => {
    setSelectedSetId(id)
    setQuizStarted(false)
    setQuizCompleted(false)
    setQuestions([])
  }

  const handleQuizTypeChange = (type: QuizType) => {
    setQuizType(type)
  }

  const handleQuestionCountChange = (value: number[]) => {
    setQuestionCount(value[0])
  }

  const generateQuiz = () => {
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

    // Shuffle and select words for the quiz
    const shuffledWords = [...selectedSet.words].sort(() => Math.random() - 0.5)
    const selectedWords = shuffledWords.slice(0, Math.min(questionCount, shuffledWords.length))

    // Generate questions based on quiz type
    const newQuestions: QuizQuestion[] = selectedWords.map((word) => {
      const question: QuizQuestion = {
        id: word.id,
        word: word.word,
        correctAnswer: word.meaning,
      }

      if (quizType === "multiple-choice") {
        // Generate 3 incorrect options
        const incorrectOptions = selectedSet.words
          .filter((w) => w.id !== word.id)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map((w) => w.meaning)

        // Add correct answer and shuffle
        const allOptions = [...incorrectOptions, word.meaning].sort(() => Math.random() - 0.5)
        question.options = allOptions
      }

      return question
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
    const isCorrect = currentAnswer.toLowerCase() === currentQuestion.correctAnswer.toLowerCase()

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

  const handleMultipleChoiceSelect = (option: string) => {
    setCurrentAnswer(option)
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
  ]

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-6">Quiz</h1>

      <div className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="outline" size="sm">
            Home
          </Button>
        </Link>
        <Link href="/vocabulary">
          <Button variant="outline" size="sm">
            Vocabulary
          </Button>
        </Link>
        <Link href="/flashcards">
          <Button variant="outline" size="sm">
            Flashcards
          </Button>
        </Link>
      </div>

      {!quizStarted ? (
        <Card>
          <CardHeader>
            <CardTitle>Create a Quiz</CardTitle>
            <CardDescription>Generate a random quiz from your vocabulary sets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vocab-set">Vocabulary Set</Label>
              <Select value={selectedSetId || ""} onValueChange={handleSelectSet}>
                <SelectTrigger id="vocab-set">
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
              <Label>Quiz Type</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant={quizType === "multiple-choice" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => handleQuizTypeChange("multiple-choice")}
                >
                  Multiple Choice
                </Button>
                <Button
                  variant={quizType === "write-answer" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => handleQuizTypeChange("write-answer")}
                >
                  Write Answer
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Number of Questions</Label>
                <span className="text-sm">{questionCount}</span>
              </div>
              <Slider
                value={[questionCount]}
                min={5}
                max={Math.max(maxQuestionCount, 5)}
                step={1}
                onValueChange={handleQuestionCountChange}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={generateQuiz} className="w-full">
              <Shuffle className="mr-2 h-4 w-4" /> Generate Quiz
            </Button>
          </CardFooter>
        </Card>
      ) : quizCompleted ? (
        <Card>
          <CardHeader>
            <CardTitle>Quiz Results</CardTitle>
            <CardDescription>
              You scored {score} out of {questions.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="text-6xl font-bold">{Math.round((score / questions.length) * 100)}%</div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-[1fr_1fr_auto] font-medium bg-muted p-3">
                  <div>Word</div>
                  <div>Your Answer</div>
                  <div className="w-10"></div>
                </div>
                {questions.map((question, index) => (
                  <div key={question.id} className="grid grid-cols-[1fr_1fr_auto] p-3 border-t">
                    <div>{question.word}</div>
                    <div>{question.userAnswer || "-"}</div>
                    <div>
                      {question.isCorrect ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <div className="flex flex-col">
                          <X className="h-5 w-5 text-red-500" />
                          <span className="text-xs text-gray-500">{question.correctAnswer}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="outline" onClick={restartQuiz} className="flex-1">
              <RotateCcw className="mr-2 h-4 w-4" /> Restart Quiz
            </Button>
            <Button onClick={() => setQuizStarted(false)} className="flex-1">
              Create New Quiz
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                Question {currentQuestionIndex + 1} of {questions.length}
              </CardTitle>
              <div className="text-sm text-gray-500">
                Score: {score}/{currentQuestionIndex}
              </div>
            </div>
            <CardDescription>
              {selectedSet && (
                <span>
                  Translate from{" "}
                  {languages.find((l) => l.value === selectedSet.sourceLanguage)?.label || selectedSet.sourceLanguage}{" "}
                  to{" "}
                  {languages.find((l) => l.value === selectedSet.targetLanguage)?.label || selectedSet.targetLanguage}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentQuestion && (
              <div className="space-y-6">
                <div className="text-2xl font-bold text-center py-4">{currentQuestion.word}</div>

                {quizType === "multiple-choice" && currentQuestion.options && (
                  <RadioGroup value={currentAnswer} className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem
                          value={option}
                          id={`option-${index}`}
                          onClick={() => handleMultipleChoiceSelect(option)}
                        />
                        <Label htmlFor={`option-${index}`} className="flex-1 py-2">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {quizType === "write-answer" && (
                  <div className="space-y-2">
                    <Label htmlFor="answer">Your Answer</Label>
                    <Input
                      id="answer"
                      value={currentAnswer}
                      onChange={handleWriteAnswerChange}
                      placeholder="Type your answer..."
                    />
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleAnswerSubmit} disabled={!currentAnswer} className="w-full">
              Submit Answer
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
