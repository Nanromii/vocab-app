export type VocabWord = {
  id: string
  word: string
  meaning: string
  createdAt: string
}

export type VocabSet = {
  id: string
  name: string
  sourceLanguage: string
  targetLanguage: string
  words: VocabWord[]
  createdAt: string
}
