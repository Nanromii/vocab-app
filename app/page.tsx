import Link from "next/link"
import { GraduationCap, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link className="flex items-center justify-center" href="/">
          <GraduationCap className="h-6 w-6 mr-2 text-primary" />
          <span className="font-bold">VocabMaster</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/">
            <Button variant="nav-pink" size="sm" className="rounded-full">
              Home
            </Button>
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/flashcards">
            <Button variant="nav-blue" size="sm" className="rounded-full">
              Flashcards
            </Button>
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/quiz">
            <Button variant="nav-purple" size="sm" className="rounded-full">
              Quiz
            </Button>
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/matching">
            <Button variant="nav-yellow" size="sm" className="rounded-full">
              Matching
            </Button>
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/puzzle">
            <Button variant="nav-green" size="sm" className="rounded-full">
              Puzzle
            </Button>
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/vocabulary">
            <Button variant="nav-green" size="sm" className="rounded-full">
              Vocabulary
            </Button>
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Master Vocabulary in Any Language
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Create flashcards, take quizzes, and track your progress with our powerful vocabulary learning
                  platform.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/vocabulary?tab=create">
                  <Button className="rounded-full px-8">
                    <Sparkles className="mr-2 h-4 w-4" /> Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-5 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="inline-block rounded-lg bg-pink-100 p-2">
                  <GraduationCap className="h-10 w-10 text-pink-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Flashcards</h3>
                  <p className="text-muted-foreground">
                    Create and study flashcards to memorize vocabulary in any language.
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <div className="inline-block rounded-lg bg-purple-100 p-2">
                  <GraduationCap className="h-10 w-10 text-purple-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Random Quizzes</h3>
                  <p className="text-muted-foreground">
                    Generate random quizzes from your vocabulary lists to test your knowledge.
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <div className="inline-block rounded-lg bg-amber-100 p-2">
                  <GraduationCap className="h-10 w-10 text-amber-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Matching Game</h3>
                  <p className="text-muted-foreground">
                    Play matching games to improve your vocabulary recognition and memory.
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <div className="inline-block rounded-lg bg-green-100 p-2">
                  <GraduationCap className="h-10 w-10 text-green-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Puzzle Game</h3>
                  <p className="text-muted-foreground">
                    Play puzzle games while learning vocabulary to make learning more fun.
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <div className="inline-block rounded-lg bg-blue-100 p-2">
                  <GraduationCap className="h-10 w-10 text-blue-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Multi-language</h3>
                  <p className="text-muted-foreground">
                    Learn vocabulary in any language with our comprehensive multi-language support.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">© 2025 VocabMaster. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  )
}
