"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, X, Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import type { VocabSet, VocabWord } from "@/lib/types"
import Link from "next/link"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

export default function VocabularyPage() {
  const { toast } = useToast()
  const [vocabSets, setVocabSets] = useState<VocabSet[]>([])
  const [newSetName, setNewSetName] = useState("")
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["english", "vietnamese"])
  const [activeSet, setActiveSet] = useState<VocabSet | null>(null)
  const [newTranslations, setNewTranslations] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState("sets")

  // Load vocabulary sets from localStorage on component mount
  useEffect(() => {
    const savedSets = localStorage.getItem("vocabSets")
    if (savedSets) {
      try {
        const sets = JSON.parse(savedSets)

        // Handle migration from old format to new format if needed
        const migratedSets = sets.map((set: any) => {
          if (!set.languages && (set.sourceLanguages || set.sourceLanguage)) {
            // Convert old format to new format
            const languages = [...(set.sourceLanguages || [set.sourceLanguage]), set.targetLanguage].filter(Boolean)

            // Convert words to new format
            const words = set.words.map((word: any) => {
              const translations: Record<string, string> = {}

              // Add source language translations
              if (set.sourceLanguages) {
                set.sourceLanguages.forEach((lang: string) => {
                  if (word.translations && word.translations[lang]) {
                    translations[lang] = word.translations[lang]
                  }
                })
              }

              // Add original word
              if (set.sourceLanguage && word.word) {
                translations[set.sourceLanguage] = word.word
              }

              // Add target language translation
              if (set.targetLanguage && word.meaning) {
                translations[set.targetLanguage] = word.meaning
              }

              return {
                id: word.id,
                translations,
                createdAt: word.createdAt,
              }
            })

            return {
              ...set,
              languages,
              words,
            }
          }
          return set
        })

        setVocabSets(migratedSets)
      } catch (e) {
        console.error("Error loading vocabulary sets:", e)
        setVocabSets([])
      }
    }
  }, [])

  // Save vocabulary sets to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("vocabSets", JSON.stringify(vocabSets))
  }, [vocabSets])

  // Add this useEffect to handle URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const tabParam = urlParams.get("tab")
    if (tabParam === "create") {
      setActiveTab("create")
    }
  }, [])

  // Initialize newTranslations when activeSet changes
  useEffect(() => {
    if (activeSet) {
      const initialTranslations: Record<string, string> = {}
      activeSet.languages.forEach((lang) => {
        initialTranslations[lang] = ""
      })
      setNewTranslations(initialTranslations)
    }
  }, [activeSet])

  const createNewSet = () => {
    if (!newSetName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for your vocabulary set",
        variant: "destructive",
      })
      return
    }

    if (selectedLanguages.length < 2) {
      toast({
        title: "Error",
        description: "Please select at least two languages",
        variant: "destructive",
      })
      return
    }

    const newSet: VocabSet = {
      id: Date.now().toString(),
      name: newSetName,
      languages: selectedLanguages,
      words: [],
      createdAt: new Date().toISOString(),
    }

    setVocabSets([...vocabSets, newSet])
    setNewSetName("")
    setActiveSet(newSet)
    setActiveTab("sets") // Switch to sets tab
    toast({
      title: "Success",
      description: "New vocabulary set created",
    })
  }

  const deleteSet = (id: string) => {
    setVocabSets(vocabSets.filter((set) => set.id !== id))
    if (activeSet && activeSet.id === id) {
      setActiveSet(null)
    }
    toast({
      title: "Success",
      description: "Vocabulary set deleted",
    })
  }

  const addWord = () => {
    if (!activeSet) return

    // Check if at least one translation is provided
    const hasTranslation = Object.values(newTranslations).some((text) => text.trim() !== "")

    if (!hasTranslation) {
      toast({
        title: "Error",
        description: "Please enter at least one translation",
        variant: "destructive",
      })
      return
    }

    // Create translations object
    const translations: Record<string, string> = {}
    Object.entries(newTranslations).forEach(([lang, text]) => {
      if (text.trim()) {
        translations[lang] = text.trim()
      }
    })

    const newWordObj: VocabWord = {
      id: Date.now().toString(),
      translations,
      createdAt: new Date().toISOString(),
    }

    const updatedSet = {
      ...activeSet,
      words: [...activeSet.words, newWordObj],
    }

    setVocabSets(vocabSets.map((set) => (set.id === activeSet.id ? updatedSet : set)))
    setActiveSet(updatedSet)

    // Reset form
    const resetTranslations: Record<string, string> = {}
    activeSet.languages.forEach((lang) => {
      resetTranslations[lang] = ""
    })
    setNewTranslations(resetTranslations)

    toast({
      title: "Success",
      description: "Word added to vocabulary set",
    })
  }

  const deleteWord = (wordId: string) => {
    if (!activeSet) return

    const updatedWords = activeSet.words.filter((word) => word.id !== wordId)
    const updatedSet = { ...activeSet, words: updatedWords }

    setVocabSets(vocabSets.map((set) => (set.id === activeSet.id ? updatedSet : set)))
    setActiveSet(updatedSet)
    toast({
      title: "Success",
      description: "Word removed from vocabulary set",
    })
  }

  const handleLanguageCheckboxChange = (language: string, checked: boolean) => {
    if (checked) {
      setSelectedLanguages([...selectedLanguages, language])
    } else {
      if (selectedLanguages.length > 2) {
        setSelectedLanguages(selectedLanguages.filter((lang) => lang !== language))
      } else {
        toast({
          title: "Error",
          description: "You must select at least two languages",
          variant: "destructive",
        })
      }
    }
  }

  const handleTranslationChange = (language: string, value: string) => {
    setNewTranslations({
      ...newTranslations,
      [language]: value,
    })
  }

  // Language list
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
      <h1 className="text-3xl font-bold mb-6">Vocabulary Manager</h1>

      <div className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="outline" size="sm">
            Home
          </Button>
        </Link>
        <Link href="/flashcards">
          <Button variant="outline" size="sm">
            Flashcards
          </Button>
        </Link>
        <Link href="/quiz">
          <Button variant="outline" size="sm">
            Quiz
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="sets">My Sets</TabsTrigger>
          <TabsTrigger value="create">Create New Set</TabsTrigger>
        </TabsList>

        <TabsContent value="sets">
          {vocabSets.length === 0 ? (
            <div className="text-center py-12">
              <Languages className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium">No vocabulary sets yet</h3>
              <p className="text-gray-500 mt-2 mb-4">Create your first vocabulary set to get started</p>
              <Button onClick={() => setActiveTab("create")}>Create New Set</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vocabSets.map((set) => (
                <Card key={set.id} className={activeSet?.id === set.id ? "border-primary" : ""}>
                  <CardHeader>
                    <CardTitle>{set.name}</CardTitle>
                    <CardDescription>
                      {set.languages?.map((lang) => getLanguageLabel(lang)).join(", ") || "Multiple languages"}
                      {" • "}
                      {set.words.length} words
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => setActiveSet(set)}>
                      View Words
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => deleteSet(set.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {activeSet && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">
                  {activeSet.name}{" "}
                  <span className="text-sm font-normal text-gray-500">
                    ({activeSet.languages?.map((lang) => getLanguageLabel(lang)).join(", ") || "Multiple languages"})
                  </span>
                </h2>
                <div className="flex items-center gap-2">
                  <Link href="/quiz">
                    <Button variant="outline" size="sm">
                      Create Quiz
                    </Button>
                  </Link>
                  <Link href="/flashcards">
                    <Button variant="outline" size="sm">
                      Practice Flashcards
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => setActiveSet(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Add New Word</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeSet.languages?.map((language) => (
                      <div key={language} className="space-y-2">
                        <Label htmlFor={`translation-${language}`}>{getLanguageLabel(language)}</Label>
                        <Textarea
                          id={`translation-${language}`}
                          value={newTranslations[language] || ""}
                          onChange={(e) => handleTranslationChange(language, e.target.value)}
                          placeholder={`Enter ${getLanguageLabel(language)} translation`}
                          className="min-h-[80px]"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={addWord} className="w-full">
                    <Plus className="mr-2 h-4 w-4" /> Add Word
                  </Button>
                </CardFooter>
              </Card>

              {activeSet.words.length === 0 ? (
                <div className="text-center py-8 border rounded-lg">
                  <p className="text-gray-500">No words in this set yet. Add your first word above.</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden overflow-x-auto">
                  <div
                    className="grid font-medium bg-muted p-3"
                    style={{
                      gridTemplateColumns: `repeat(${activeSet.languages?.length || 1}, 1fr) auto`,
                    }}
                  >
                    {activeSet.languages?.map((language) => (
                      <div key={language}>{getLanguageLabel(language)}</div>
                    ))}
                    <div className="w-10"></div>
                  </div>
                  {activeSet.words.map((word) => (
                    <div
                      key={word.id}
                      className="grid p-3 border-t"
                      style={{
                        gridTemplateColumns: `repeat(${activeSet.languages?.length || 1}, 1fr) auto`,
                      }}
                    >
                      {activeSet.languages?.map((language) => (
                        <div key={language}>
                          {word.translations && word.translations[language] ? word.translations[language] : "-"}
                        </div>
                      ))}
                      <div>
                        <Button variant="ghost" size="icon" onClick={() => deleteWord(word.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New Vocabulary Set</CardTitle>
              <CardDescription>Create a new set to organize your vocabulary words</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="set-name">Set Name</Label>
                <Input
                  id="set-name"
                  value={newSetName}
                  onChange={(e) => setNewSetName(e.target.value)}
                  placeholder="e.g., Basic Phrases, Travel Vocabulary"
                />
              </div>

              <div className="space-y-2">
                <Label>Languages (select at least two)</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 border rounded-md p-3">
                  {languages.map((language) => (
                    <div key={language.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`lang-${language.value}`}
                        checked={selectedLanguages.includes(language.value)}
                        onCheckedChange={(checked) => handleLanguageCheckboxChange(language.value, checked as boolean)}
                      />
                      <Label htmlFor={`lang-${language.value}`} className="cursor-pointer">
                        {language.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={createNewSet} className="w-full">
                <Plus className="mr-2 h-4 w-4" /> Create Vocabulary Set
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
