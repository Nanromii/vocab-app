"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
  const [showFront, setShowFront] = useState(true)
  const [nextLanguageIndex, setNextLanguageIndex] = useState(0)

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
    setNextLanguageIndex(0)
    setShowFront(true)
  }, [selectedSetId, vocabSets, shuffled])

  const handleSelectSet = (id: string) => {
    setSelectedSetId(id)
  }

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      // Prepare next card
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      setCurrentLanguageIndex(0)
      setNextLanguageIndex(0)
      setShowFront(true)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      // Prepare previous card
      const prevIndex = currentIndex - 1
      setCurrentIndex(prevIndex)
      setCurrentLanguageIndex(0)
      setNextLanguageIndex(0)
      setShowFront(true)
    }
  }

  const handleFlip = () => {
    // Calculate the next language index
    const nextLangIndex = (currentLanguageIndex + 1) % allLanguages.length

    // Set the next language index that will be shown after flip
    setNextLanguageIndex(nextLangIndex)

    // Flip the card
    setShowFront(!showFront)

    // After the flip animation completes, update the current language
    setTimeout(() => {
      setCurrentLanguageIndex(nextLangIndex)
    }, 300)
  }

  const handleShuffle = () => {
    if (cards.length === 0) return

    setShuffled(true)
    setCards(shuffleArray([...cards]))
    setCurrentIndex(0)
    setCurrentLanguageIndex(0)
    setNextLanguageIndex(0)
    setShowFront(true)

    toast({
      title: "Cards shuffled",
      description: "The flashcards have been randomly shuffled",
    })
  }

  const handleReset = () => {
    setCurrentIndex(0)
    setCurrentLanguageIndex(0)
    setNextLanguageIndex(0)
    setShowFront(true)

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

  const getNextLanguage = () => {
    if (!allLanguages.length) return ""
    return allLanguages[nextLanguageIndex]
  }

  const getLanguageLabel = (code: string) => {
    const language = languages.find((l) => l.value === code)
    return language ? language.label : code
  }

  const getCurrentTranslation = () => {
    if (!cards.length || currentIndex >= cards.length) return "-"
    const currentLang = getCurrentLanguage()
    return cards[currentIndex].translations[currentLang] || "-"
  }

  const getNextTranslation = () => {
    if (!cards.length || currentIndex >= cards.length) return "-"
    const nextLang = getNextLanguage()
    return cards[currentIndex].translations[nextLang] || "-"
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-6 text-primary">Flashcards</h1>

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
        <Link href="/puzzle">
          <Button variant="nav-green" size="sm" className="rounded-full">
            Puzzle
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <Select value={selectedSetId || ""} onValueChange={handleSelectSet}>
          <SelectTrigger className="border-primary/20 focus:border-primary rounded-full">
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
            <div className="text-sm text-muted-foreground">
              Card {currentIndex + 1} of {cards.length}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleShuffle} className="rounded-full">
                <Shuffle className="h-4 w-4 mr-2" /> Shuffle
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset} className="rounded-full">
                <RotateCcw className="h-4 w-4 mr-2" /> Reset
              </Button>
            </div>
          </div>

          <div className="flex justify-center mb-8">
            <div className="w-full max-w-md h-64 cursor-pointer perspective-1000" onClick={handleFlip}>
              <div
                className={`relative w-full h-full transform-style-preserve-3d transition-transform duration-600 ${
                  showFront ? "" : "rotate-y-180"
                }`}
              >
                {/* Front of card */}
                <div className="absolute w-full h-full backface-hidden">
                  <Card className="w-full h-full bg-gradient-to-br from-primary/5 to-primary/20 border-primary/20 flex items-center justify-center p-6">
                    <div className="text-center">
                      <p className="text-sm text-primary/70 mb-2">
                        {getLanguageLabel(getCurrentLanguage())}
                        <span className="text-xs ml-2 bg-primary/10 px-2 py-1 rounded-full">
                          {currentLanguageIndex + 1}/{allLanguages.length}
                        </span>
                      </p>
                      <p className="text-2xl font-bold">{getCurrentTranslation()}</p>
                      <p className="text-xs text-muted-foreground mt-4 bg-primary/5 px-3 py-1 rounded-full inline-block">
                        <Sparkles className="h-3 w-3 inline mr-1" /> Click to flip
                      </p>
                    </div>
                  </Card>
                </div>

                {/* Back of card */}
                <div className="absolute w-full h-full backface-hidden rotate-y-180">
                  <Card className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20 flex items-center justify-center p-6">
                    <div className="text-center">
                      <p className="text-sm text-primary/70 mb-2">
                        {getLanguageLabel(getNextLanguage())}
                        <span className="text-xs ml-2 bg-primary/10 px-2 py-1 rounded-full">
                          {nextLanguageIndex + 1}/{allLanguages.length}
                        </span>
                      </p>
                      <p className="text-2xl font-bold">{getNextTranslation()}</p>
                      <p className="text-xs text-muted-foreground mt-4 bg-primary/5 px-3 py-1 rounded-full inline-block">
                        <Sparkles className="h-3 w-3 inline mr-1" /> Click to flip
                      </p>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={handlePrevious} disabled={currentIndex === 0} className="rounded-full">
              <ChevronLeft className="h-4 w-4 mr-2" /> Previous
            </Button>
            <Button onClick={handleNext} disabled={currentIndex === cards.length - 1} className="rounded-full">
              Next <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-12 border border-primary/20 rounded-lg bg-secondary/50">
          {!selectedSetId ? (
            <p className="text-muted-foreground">Please select a vocabulary set to start practicing</p>
          ) : (
            <p className="text-muted-foreground">No words found in this vocabulary set. Add some words first.</p>
          )}
        </div>
      )}
    </div>
  )
}
