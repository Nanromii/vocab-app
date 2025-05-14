"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { VocabSet } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function FlashcardsPage() {
  const { toast } = useToast()
  const [vocabSets, setVocabSets] = useState<VocabSet[]>([])
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentLanguageIndex, setCurrentLanguageIndex] = useState(0)
  const [shuffled, setShuffled] = useState(false)
  const [cards, setCards] = useState<{ translations: Record<string, string> }[]>([])
  const [allLanguages, setAllLanguages] = useState<string[]>([])

  // Load vocabulary sets from localStorage on component mount
  useEffect(() => {
    const savedSets = localStorage.getItem("vocabSets")
    if (savedSets) {
      try {
        const sets = JSON.parse(savedSets)
        setVocabSets(sets)

        // Auto-select the first set if available
        if (sets.length > 0 && !selectedSetId) {
          setSelectedSetId(sets[0].id)
        }
      } catch (e) {
        console.error("Error loading vocabulary sets:", e)
        setVocabSets([])
      }
    }
  }, [])

  // Update cards when selected set changes
  useEffect(() => {
    if (!selectedSetId) return

    const selectedSet = vocabSets.find((set) => set.id === selectedSetId)
    if (!selectedSet || selectedSet.words.length === 0) {
      setCards([])
      return
    }

    // Prepare all languages for this set
    setAllLanguages(selectedSet.languages || [])

    // Prepare cards
    const newCards = selectedSet.words.map((word) => ({
      translations: word.translations || {},
    }))

    setCards(shuffled ? shuffleArray([...newCards]) : newCards)
    setCurrentIndex(0)
    setCurrentLanguageIndex(0)
  }, [selectedSetId, vocabSets, shuffled])

  const handleSelectSet = (id: string) => {
    setSelectedSetId(id)
  }

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setCurrentLanguageIndex(0)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setCurrentLanguageIndex(0)
    }
  }

  const handleFlip = () => {
    // Cycle through languages
    const nextLanguageIndex = (currentLanguageIndex + 1) % allLanguages.length
    setCurrentLanguageIndex(nextLanguageIndex)
  }

  const handleShuffle = () => {
    if (cards.length === 0) return

    setShuffled(true)
    setCards(shuffleArray([...cards]))
    setCurrentIndex(0)
    setCurrentLanguageIndex(0)

    toast({
      title: "Cards shuffled",
      description: "The flashcards have been randomly shuffled",
    })
  }

  const handleReset = () => {
    setCurrentIndex(0)
    setCurrentLanguageIndex(0)

    toast({
      title: "Reset to beginning",
      description: "Starting from the first card",
    })
  }

  // Fisher-Yates shuffle algorithm
  const shuffleArray = (array: any[]) => {
    const newArray = [...array]
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
    }
    return newArray
  }

  const selectedSet = vocabSets.find((set) => set.id === selectedSetId)
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

  const getCurrentLanguage = () => {
    if (!allLanguages.length) return ""
    return allLanguages[currentLanguageIndex]
  }

  const getLanguageLabel = (code: string) => {
    const language = languages.find((l) => l.value === code)
    return language ? language.label : code
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-6">Flashcards</h1>

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
        <Link href="/quiz">
          <Button variant="outline" size="sm">
            Quiz
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <Select value={selectedSetId || ""} onValueChange={handleSelectSet}>
          <SelectTrigger>
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

      {selectedSet && cards.length > 0 ? (
        <>
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-500">
              Card {currentIndex + 1} of {cards.length}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleShuffle}>
                <Shuffle className="h-4 w-4 mr-2" /> Shuffle
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" /> Reset
              </Button>
            </div>
          </div>

          <div className="flex justify-center mb-8">
            <div className="w-full max-w-md h-64 cursor-pointer" onClick={handleFlip}>
              <Card className="w-full h-full">
                <CardContent className="flex items-center justify-center h-full p-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-2">
                      {getLanguageLabel(getCurrentLanguage())}
                      <span className="text-xs ml-2">
                        ({currentLanguageIndex + 1}/{allLanguages.length})
                      </span>
                    </p>
                    <p className="text-2xl font-bold">
                      {cards[currentIndex].translations[getCurrentLanguage()] || "-"}
                    </p>
                    <p className="text-xs text-gray-400 mt-4">Click to see next language</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={handlePrevious} disabled={currentIndex === 0}>
              <ChevronLeft className="h-4 w-4 mr-2" /> Previous
            </Button>
            <Button onClick={handleNext} disabled={currentIndex === cards.length - 1}>
              Next <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-12 border rounded-lg">
          {!selectedSetId ? (
            <p className="text-gray-500">Please select a vocabulary set to start practicing</p>
          ) : (
            <p className="text-gray-500">No words found in this vocabulary set. Add some words first.</p>
          )}
        </div>
      )}
    </div>
  )
}
