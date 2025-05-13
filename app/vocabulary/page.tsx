"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, X, Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import type { VocabSet, VocabWord } from "@/lib/types"

export default function VocabularyPage() {
  const { toast } = useToast()
  const [vocabSets, setVocabSets] = useState<VocabSet[]>([])
  const [newSetName, setNewSetName] = useState("")
  const [newSetLanguage, setNewSetLanguage] = useState("english")
  const [newSetTargetLanguage, setNewSetTargetLanguage] = useState("vietnamese")
  const [activeSet, setActiveSet] = useState<VocabSet | null>(null)
  const [newWord, setNewWord] = useState("")
  const [newMeaning, setNewMeaning] = useState("")
  const [editMode, setEditMode] = useState(false)

  // Load vocabulary sets from localStorage on component mount
  useEffect(() => {
    const savedSets = localStorage.getItem("vocabSets")
    if (savedSets) {
      setVocabSets(JSON.parse(savedSets))
    }
  }, [])

  // Save vocabulary sets to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("vocabSets", JSON.stringify(vocabSets))
  }, [vocabSets])

  const createNewSet = () => {
    if (!newSetName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for your vocabulary set",
        variant: "destructive",
      })
      return
    }

    const newSet: VocabSet = {
      id: Date.now().toString(),
      name: newSetName,
      sourceLanguage: newSetLanguage,
      targetLanguage: newSetTargetLanguage,
      words: [],
      createdAt: new Date().toISOString(),
    }

    setVocabSets([...vocabSets, newSet])
    setNewSetName("")
    setActiveSet(newSet)
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
    if (!newWord.trim() || !newMeaning.trim()) {
      toast({
        title: "Error",
        description: "Please enter both word and meaning",
        variant: "destructive",
      })
      return
    }

    const newWordObj: VocabWord = {
      id: Date.now().toString(),
      word: newWord,
      meaning: newMeaning,
      createdAt: new Date().toISOString(),
    }

    const updatedSet = {
      ...activeSet,
      words: [...activeSet.words, newWordObj],
    }

    setVocabSets(vocabSets.map((set) => (set.id === activeSet.id ? updatedSet : set)))
    setActiveSet(updatedSet)
    setNewWord("")
    setNewMeaning("")
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

  const languages = [
    { value: "english", label: "English" },
    { value: "vietnamese", label: "Vietnamese" },
    { value: "french", label: "French" },
    { value: "spanish", label: "Spanish" },
    { value: "german", label: "German" },
    { value: "japanese", label: "Japanese" },
    { value: "korean", label: "Korean" },
    { value: "chinese", label: "Chinese" },
    { value: "russian", label: "Russian" },
  ]

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-6">Vocabulary Manager</h1>

      <Tabs defaultValue="sets" className="w-full">
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
              <Button onClick={() => document.querySelector('[value="create"]')?.click()}>Create New Set</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vocabSets.map((set) => (
                <Card key={set.id} className={activeSet?.id === set.id ? "border-primary" : ""}>
                  <CardHeader>
                    <CardTitle>{set.name}</CardTitle>
                    <CardDescription>
                      {languages.find((l) => l.value === set.sourceLanguage)?.label} to{" "}
                      {languages.find((l) => l.value === set.targetLanguage)?.label} • {set.words.length} words
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
                    ({languages.find((l) => l.value === activeSet.sourceLanguage)?.label} to{" "}
                    {languages.find((l) => l.value === activeSet.targetLanguage)?.label})
                  </span>
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setActiveSet(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Add New Word</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-word">
                        {languages.find((l) => l.value === activeSet.sourceLanguage)?.label} Word
                      </Label>
                      <Input
                        id="new-word"
                        value={newWord}
                        onChange={(e) => setNewWord(e.target.value)}
                        placeholder="Enter word"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-meaning">
                        {languages.find((l) => l.value === activeSet.targetLanguage)?.label} Meaning
                      </Label>
                      <Input
                        id="new-meaning"
                        value={newMeaning}
                        onChange={(e) => setNewMeaning(e.target.value)}
                        placeholder="Enter meaning"
                      />
                    </div>
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
                <div className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-[1fr_1fr_auto] font-medium bg-muted p-3">
                    <div>{languages.find((l) => l.value === activeSet.sourceLanguage)?.label}</div>
                    <div>{languages.find((l) => l.value === activeSet.targetLanguage)?.label}</div>
                    <div className="w-10"></div>
                  </div>
                  {activeSet.words.map((word) => (
                    <div key={word.id} className="grid grid-cols-[1fr_1fr_auto] p-3 border-t">
                      <div>{word.word}</div>
                      <div>{word.meaning}</div>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="source-language">Source Language</Label>
                  <Select value={newSetLanguage} onValueChange={setNewSetLanguage}>
                    <SelectTrigger id="source-language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target-language">Target Language</Label>
                  <Select value={newSetTargetLanguage} onValueChange={setNewSetTargetLanguage}>
                    <SelectTrigger id="target-language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
