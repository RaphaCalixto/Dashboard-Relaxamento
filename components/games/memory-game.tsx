"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Shuffle, Clock, Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

// Ícones para os pares (ampliado)
const allIcons = [
  "🌞",
  "🌙",
  "⭐",
  "🌈",
  "🌊",
  "🌴",
  "🌵",
  "🌸",
  "🍎",
  "🍌",
  "🍇",
  "🍓",
  "🍒",
  "🍑",
  "🍍",
  "🥥",
  "🐶",
  "🐱",
  "🐭",
  "🐹",
  "🐰",
  "🦊",
  "🐻",
  "🐼",
]

type Card = {
  id: number
  icon: string
  flipped: boolean
  matched: boolean
}

type Difficulty = "easy" | "medium" | "hard"

export function MemoryGame() {
  const [cards, setCards] = useState<Card[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [matchedPairs, setMatchedPairs] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [endTime, setEndTime] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [difficulty, setDifficulty] = useState<Difficulty>("medium")
  const [gameStarted, setGameStarted] = useState(false)

  // Inicializar o jogo
  useEffect(() => {
    initGame(difficulty)
  }, [difficulty])

  // Timer para o jogo
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null

    if (gameStarted && startTime && !endTime) {
      timer = setInterval(() => {
        const now = new Date()
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000)
        setElapsedTime(elapsed)
      }, 1000)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [gameStarted, startTime, endTime])

  const getDifficultySettings = (level: Difficulty) => {
    switch (level) {
      case "easy":
        return { pairs: 6, cols: 3 }
      case "medium":
        return { pairs: 10, cols: 4 }
      case "hard":
        return { pairs: 15, cols: 5 }
      default:
        return { pairs: 10, cols: 4 }
    }
  }

  const initGame = (level: Difficulty) => {
    const { pairs } = getDifficultySettings(level)

    // Selecionar ícones aleatórios para o jogo
    const gameIcons = [...allIcons].sort(() => Math.random() - 0.5).slice(0, pairs)

    // Criar pares de cartas
    const cardPairs = [...gameIcons, ...gameIcons]
      .map((icon, index) => ({
        id: index,
        icon,
        flipped: false,
        matched: false,
      }))
      .sort(() => Math.random() - 0.5) // Embaralhar

    setCards(cardPairs)
    setFlippedCards([])
    setMoves(0)
    setGameOver(false)
    setMatchedPairs(0)
    setIsProcessing(false)
    setStartTime(null)
    setEndTime(null)
    setElapsedTime(0)
    setGameStarted(false)
  }

  const handleCardClick = (id: number) => {
    // Iniciar o jogo no primeiro clique
    if (!gameStarted) {
      setGameStarted(true)
      setStartTime(new Date())
    }

    // Ignorar cliques durante processamento ou em cartas já viradas/combinadas
    if (isProcessing || flippedCards.length === 2 || cards[id].flipped || cards[id].matched) {
      return
    }

    // Virar a carta
    const newCards = [...cards]
    newCards[id].flipped = true
    setCards(newCards)

    // Adicionar à lista de cartas viradas
    const newFlippedCards = [...flippedCards, id]
    setFlippedCards(newFlippedCards)

    // Se temos 2 cartas viradas, verificar se são um par
    if (newFlippedCards.length === 2) {
      setIsProcessing(true)
      setMoves((prev) => prev + 1)

      const [firstId, secondId] = newFlippedCards

      // Verificar se as cartas têm o mesmo ícone
      if (cards[firstId].icon === cards[secondId].icon) {
        // É um par!
        setTimeout(() => {
          const matchedCards = [...newCards]
          matchedCards[firstId].matched = true
          matchedCards[secondId].matched = true
          setCards(matchedCards)
          setFlippedCards([])
          setMatchedPairs((prev) => {
            const newMatchedPairs = prev + 1
            // Verificar se o jogo acabou
            if (newMatchedPairs === getDifficultySettings(difficulty).pairs) {
              setGameOver(true)
              setEndTime(new Date())
            }
            return newMatchedPairs
          })
          setIsProcessing(false)
        }, 500)
      } else {
        // Não é um par, virar as cartas de volta
        setTimeout(() => {
          const unmatchedCards = [...newCards]
          unmatchedCards[firstId].flipped = false
          unmatchedCards[secondId].flipped = false
          setCards(unmatchedCards)
          setFlippedCards([])
          setIsProcessing(false)
        }, 1000)
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const { cols } = getDifficultySettings(difficulty)
  const gridCols = `grid-cols-${cols}`

  return (
    <div className="flex flex-col items-center">
      <div className="w-full flex flex-wrap justify-between items-center mb-4 gap-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="difficulty">Dificuldade:</Label>
          <Select
            value={difficulty}
            onValueChange={(value: Difficulty) => setDifficulty(value)}
            disabled={gameStarted && !gameOver}
          >
            <SelectTrigger id="difficulty" className="w-[120px]">
              <SelectValue placeholder="Médio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Fácil</SelectItem>
              <SelectItem value="medium">Médio</SelectItem>
              <SelectItem value="hard">Difícil</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Trophy className="h-3 w-3" />
            <span>
              Pares: {matchedPairs}/{getDifficultySettings(difficulty).pairs}
            </span>
          </Badge>

          <Badge variant="outline" className="flex items-center gap-1">
            <Shuffle className="h-3 w-3" />
            <span>Movimentos: {moves}</span>
          </Badge>

          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Tempo: {formatTime(elapsedTime)}</span>
          </Badge>
        </div>

        <Button
          onClick={() => initGame(difficulty)}
          size="sm"
          variant="outline"
          className="hover:bg-gray-200/50 dark:hover:bg-gray-700/50 active:bg-gray-300/50 dark:active:bg-gray-600/50"
        >
          <Shuffle className="h-4 w-4 mr-1" />
          Reiniciar
        </Button>
      </div>

      <div className={`grid grid-cols-3 md:${gridCols} gap-2 md:gap-4 max-w-3xl mx-auto`}>
        {cards.map((card) => (
          <div
            key={card.id}
            className={`aspect-square perspective-500 cursor-pointer select-none ${
              difficulty === "hard" ? "h-16 w-16 md:h-20 md:w-20" : "h-20 w-20 md:h-24 md:w-24"
            }`}
            onClick={() => handleCardClick(card.id)}
          >
            <div
              className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
                card.flipped || card.matched ? "rotate-y-180" : ""
              }`}
            >
              {/* Frente da carta (escondida) */}
              <div
                className={`absolute w-full h-full flex items-center justify-center rounded-lg bg-gray-300 dark:bg-gray-700 border-2 border-gray-400 dark:border-gray-600 backface-hidden ${
                  card.flipped || card.matched ? "invisible" : ""
                }`}
              >
                <span className="text-2xl">?</span>
              </div>

              {/* Verso da carta (com ícone) */}
              <div
                className={`absolute w-full h-full flex items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900 border-2 border-blue-300 dark:border-blue-700 backface-hidden rotate-y-180 ${
                  card.matched ? "opacity-70" : ""
                }`}
              >
                <span className="text-3xl">{card.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {gameOver && (
        <div className="mt-6 text-center">
          <p className="text-lg font-bold text-green-600 dark:text-green-400">Parabéns! Você completou o jogo!</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Você encontrou todos os pares em {moves} movimentos e {formatTime(elapsedTime)}.
          </p>
          <Button
            onClick={() => initGame(difficulty)}
            className="mt-2 hover:bg-blue-600 active:bg-blue-700 dark:hover:bg-blue-600 dark:active:bg-blue-700"
          >
            Jogar Novamente
          </Button>
        </div>
      )}
    </div>
  )
}
