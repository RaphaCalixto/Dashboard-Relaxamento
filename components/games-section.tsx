"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bomb, Grid3X3, Crown, Brain } from "lucide-react"
import { CheckersGame } from "./games/checkers-game"
import { MemoryGame } from "./games/memory-game"

export function GamesSection() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null)

  const games = [
    {
      id: "minesweeper",
      title: "Campo Minado",
      icon: Bomb,
      description: "Clássico jogo de lógica e estratégia",
      difficulty: "Médio",
      color: "bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-none shadow-lg",
    },
    {
      id: "tictactoe",
      title: "Jogo da Velha",
      icon: Grid3X3,
      description: "Jogo simples e divertido para dois jogadores",
      difficulty: "Fácil",
      color: "bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-none shadow-lg",
    },
    {
      id: "checkers",
      title: "Dama",
      icon: Crown,
      description: "Jogo de estratégia clássico",
      difficulty: "Difícil",
      color: "bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-none shadow-lg",
    },
    {
      id: "memory",
      title: "Jogo da Memória",
      icon: Brain,
      description: "Teste sua memória encontrando os pares",
      difficulty: "Médio",
      color: "bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-none shadow-lg",
    },
  ]

  const renderGame = () => {
    switch (selectedGame) {
      case "minesweeper":
        return <MinesweeperGame />
      case "tictactoe":
        return <TicTacToeGame />
      case "checkers":
        return <CheckersGame />
      case "memory":
        return <MemoryGame />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Sessão de Jogos</h2>
        <p className="text-gray-200">Relaxe e exercite sua mente com nossos jogos</p>
      </div>

      {!selectedGame ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {games.map((game) => (
            <Card
              key={game.id}
              className={`cursor-pointer transition-all duration-200 ${game.color} hover:shadow-xl transform hover:-translate-y-1`}
            >
              <CardHeader className="text-center">
                <game.icon className="h-12 w-12 mx-auto mb-2 text-gray-700 dark:text-gray-300" />
                <CardTitle className="text-xl">{game.title}</CardTitle>
                <Badge variant="secondary" className="w-fit mx-auto">
                  {game.difficulty}
                </Badge>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4">{game.description}</p>
                <Button
                  onClick={() => setSelectedGame(game.id)}
                  className="w-full hover:bg-blue-600 active:bg-blue-700 dark:hover:bg-blue-600 dark:active:bg-blue-700"
                >
                  Jogar Agora
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-white">{games.find((g) => g.id === selectedGame)?.title}</h3>
            <Button
              variant="outline"
              onClick={() => setSelectedGame(null)}
              className="bg-white/20 backdrop-blur-md border-white/20 hover:bg-white/30 active:bg-gray-400/30 text-white"
            >
              Voltar aos Jogos
            </Button>
          </div>
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-none shadow-lg">
            <CardContent className="p-6">{renderGame()}</CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function MinesweeperGame() {
  const [board, setBoard] = useState(() => {
    const newBoard = Array(8)
      .fill(null)
      .map(() => Array(8).fill({ revealed: false, mine: false, count: 0 }))

    // Adicionar algumas minas aleatórias
    const mines = new Set()
    while (mines.size < 10) {
      const row = Math.floor(Math.random() * 8)
      const col = Math.floor(Math.random() * 8)
      mines.add(`${row}-${col}`)
    }

    mines.forEach((pos) => {
      const [row, col] = pos.split("-").map(Number)
      newBoard[row][col] = { ...newBoard[row][col], mine: true }
    })

    // Calcular números para cada célula
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (!newBoard[row][col].mine) {
          let count = 0
          for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
              const newRow = row + i
              const newCol = col + j
              if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8 && newBoard[newRow][newCol].mine) {
                count++
              }
            }
          }
          newBoard[row][col] = { ...newBoard[row][col], count }
        }
      }
    }

    return newBoard
  })

  const [gameOver, setGameOver] = useState(false)
  const [gameWon, setGameWon] = useState(false)
  const [exploded, setExploded] = useState(false)

  const revealCell = (row: number, col: number) => {
    if (gameOver || board[row][col].revealed) return

    const newBoard = [...board]
    newBoard[row][col] = { ...newBoard[row][col], revealed: true }

    // Se clicou em uma mina
    if (newBoard[row][col].mine) {
      setExploded(true)
      setGameOver(true)
      // Revelar todas as minas
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          if (newBoard[i][j].mine) {
            newBoard[i][j] = { ...newBoard[i][j], revealed: true }
          }
        }
      }
    } else {
      // Verificar se ganhou (todas as células não-mina foram reveladas)
      let revealedCount = 0
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          if (newBoard[i][j].revealed && !newBoard[i][j].mine) {
            revealedCount++
          }
        }
      }
      if (revealedCount === 64 - 10) {
        // 64 células total - 10 minas
        setGameWon(true)
        setGameOver(true)
      }
    }

    setBoard(newBoard)
  }

  const resetGame = () => {
    // Reinicializar o jogo
    const newBoard = Array(8)
      .fill(null)
      .map(() => Array(8).fill({ revealed: false, mine: false, count: 0 }))

    // Adicionar algumas minas aleatórias
    const mines = new Set()
    while (mines.size < 10) {
      const row = Math.floor(Math.random() * 8)
      const col = Math.floor(Math.random() * 8)
      mines.add(`${row}-${col}`)
    }

    mines.forEach((pos) => {
      const [row, col] = pos.split("-").map(Number)
      newBoard[row][col] = { ...newBoard[row][col], mine: true }
    })

    // Calcular números para cada célula
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (!newBoard[row][col].mine) {
          let count = 0
          for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
              const newRow = row + i
              const newCol = col + j
              if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8 && newBoard[newRow][newCol].mine) {
                count++
              }
            }
          }
          newBoard[row][col] = { ...newBoard[row][col], count }
        }
      }
    }

    setBoard(newBoard)
    setGameOver(false)
    setGameWon(false)
    setExploded(false)
  }

  return (
    <div>
      {exploded && (
        <div className="text-center mb-4">
          <p className="text-xl font-bold text-red-600 dark:text-red-400">💥 Você explodiu! 💥</p>
          <Button
            onClick={resetGame}
            className="mt-2 hover:bg-blue-600 active:bg-blue-700 dark:hover:bg-blue-600 dark:active:bg-blue-700"
          >
            Tentar Novamente
          </Button>
        </div>
      )}

      {gameWon && (
        <div className="text-center mb-4">
          <p className="text-xl font-bold text-green-600 dark:text-green-400">🎉 Parabéns! Você venceu! 🎉</p>
          <Button
            onClick={resetGame}
            className="mt-2 hover:bg-blue-600 active:bg-blue-700 dark:hover:bg-blue-600 dark:active:bg-blue-700"
          >
            Jogar Novamente
          </Button>
        </div>
      )}

      <div className="grid grid-cols-8 gap-1 max-w-md mx-auto">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <Button
              key={`${rowIndex}-${colIndex}`}
              variant={cell.revealed ? "secondary" : "outline"}
              className={`h-8 w-8 p-0 text-xs hover:bg-gray-200/50 dark:hover:bg-gray-700/50 active:bg-gray-300/50 dark:active:bg-gray-600/50 ${
                cell.revealed && cell.mine ? "bg-red-500 hover:bg-red-500" : ""
              }`}
              onClick={() => revealCell(rowIndex, colIndex)}
              disabled={gameOver}
            >
              {cell.revealed ? (cell.mine ? "💣" : cell.count > 0 ? cell.count : "") : ""}
            </Button>
          )),
        )}
      </div>

      {!gameOver && (
        <p className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
          Clique nas células para revelar. Evite as bombas!
        </p>
      )}
    </div>
  )
}

function TicTacToeGame() {
  const [board, setBoard] = useState(Array(9).fill(null))
  const [isXNext, setIsXNext] = useState(true)

  const handleClick = (index: number) => {
    if (board[index] || calculateWinner(board)) return

    const newBoard = [...board]
    newBoard[index] = isXNext ? "X" : "O"
    setBoard(newBoard)
    setIsXNext(!isXNext)
  }

  const winner = calculateWinner(board)
  const resetGame = () => {
    setBoard(Array(9).fill(null))
    setIsXNext(true)
  }

  return (
    <div>
      <div className="text-center mb-4">
        {winner ? (
          <p className="text-xl font-bold text-green-600 dark:text-green-400">Vencedor: {winner}!</p>
        ) : (
          <p className="text-lg text-gray-700 dark:text-gray-300">Próximo jogador: {isXNext ? "X" : "O"}</p>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto mb-4">
        {board.map((cell, index) => (
          <Button
            key={index}
            variant="outline"
            className="h-16 w-16 text-2xl font-bold hover:bg-gray-200/50 dark:hover:bg-gray-700/50 active:bg-gray-300/50 dark:active:bg-gray-600/50"
            onClick={() => handleClick(index)}
          >
            {cell}
          </Button>
        ))}
      </div>
      <div className="text-center">
        <Button
          onClick={resetGame}
          className="hover:bg-blue-600 active:bg-blue-700 dark:hover:bg-blue-600 dark:active:bg-blue-700"
        >
          Novo Jogo
        </Button>
      </div>
    </div>
  )
}

function calculateWinner(squares: (string | null)[]) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ]

  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i]
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a]
    }
  }
  return null
}
