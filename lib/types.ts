export type VocabWord = {
  id: string
  translations: Record<string, string> // Lưu trữ nghĩa của từ trong các ngôn ngữ khác nhau
  createdAt: string
}

export type VocabSet = {
  id: string
  name: string
  languages: string[] // Danh sách các ngôn ngữ trong bộ từ vựng
  words: VocabWord[]
  createdAt: string
}
