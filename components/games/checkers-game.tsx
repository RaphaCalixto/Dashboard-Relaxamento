"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Crown } from "lucide-react"

type PieceType = "red" | "black" | null
type KingType = boolean
type SquareType = {
  piece: PieceType
  isKing: KingType
}
type Position = {
  row: number
  col: number
}

export function CheckersGame() {
  const [board, setBoard] = useState<SquareType[][]>([])
  const [selectedPiece, setSelectedPiece] = useState<Position | null>(null)
  const [currentPlayer, setCurrentPlayer] = useState<PieceType>("red")
  const [possibleMoves, setPossibleMoves] = useState<Position[]>([])
  const [capturedPieces, setCapturedPieces] = useState({ red: 0, black: 0 })
  const [gameStatus, setGameStatus] = useState<string>("")

  // Inicializar o tabuleiro
  useEffect(() => {
    initializeBoard()
  }, [])

  const initializeBoard = () => {
    const newBoard: SquareType[][] = Array(8)
      .fill(null)
      .map(() => Array(8).fill({ piece: null, isKing: false }))

    // Configurar peças iniciais
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        // Inicializa cada célula com um objeto
        newBoard[row][col] = { piece: null, isKing: false }

        // Posiciona as peças pretas (linhas 0-2)
        if (row < 3 && (row + col) % 2 === 1) {
          newBoard[row][col] = { piece: "black", isKing: false }
        }
        // Posiciona as peças vermelhas (linhas 5-7)
        else if (row > 4 && (row + col) % 2 === 1) {
          newBoard[row][col] = { piece: "red", isKing: false }
        }
      }
    }
    setBoard(newBoard)
    setGameStatus(`Vez do jogador: ${currentPlayer === "red" ? "Vermelho" : "Preto"}`)
  }

  const handleSquareClick = (row: number, col: number) => {
    // Se não há peça selecionada e a célula clicada tem uma peça do jogador atual
    if (!selectedPiece && board[row][col].piece === currentPlayer) {
      const moves = findPossibleMoves(row, col)
      if (moves.length > 0) {
        setSelectedPiece({ row, col })
        setPossibleMoves(moves)
      }
    }
    // Se há uma peça selecionada e o clique é em um movimento possível
    else if (selectedPiece && possibleMoves.some((move) => move.row === row && move.col === col)) {
      movePiece(selectedPiece, { row, col })
      setSelectedPiece(null)
      setPossibleMoves([])
    }
    // Se há uma peça selecionada e o clique é em outra peça do mesmo jogador
    else if (selectedPiece && board[row][col].piece === currentPlayer) {
      const moves = findPossibleMoves(row, col)
      if (moves.length > 0) {
        setSelectedPiece({ row, col })
        setPossibleMoves(moves)
      }
    }
    // Se há uma peça selecionada e o clique é em um lugar inválido
    else if (selectedPiece) {
      setSelectedPiece(null)
      setPossibleMoves([])
    }
  }

  const findPossibleMoves = (row: number, col: number): Position[] => {
    const moves: Position[] = []
    const piece = board[row][col].piece
    const isKing = board[row][col].isKing

    if (!piece) return moves

    // Direções de movimento (depende se é rei ou não)
    const directions = []
    if (piece === "red" || isKing) directions.push(-1) // Movimento para cima
    if (piece === "black" || isKing) directions.push(1) // Movimento para baixo

    // Verificar movimentos simples
    for (const rowDir of directions) {
      for (const colDir of [-1, 1]) {
        // Movimento diagonal para esquerda e direita
        const newRow = row + rowDir
        const newCol = col + colDir

        // Verificar se está dentro do tabuleiro
        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
          // Verificar se o espaço está vazio
          if (board[newRow][newCol].piece === null) {
            moves.push({ row: newRow, col: newCol })
          }
          // Verificar se pode capturar
          else if (board[newRow][newCol].piece !== piece) {
            const jumpRow = newRow + rowDir
            const jumpCol = newCol + colDir
            if (jumpRow >= 0 && jumpRow < 8 && jumpCol >= 0 && jumpCol < 8 && board[jumpRow][jumpCol].piece === null) {
              moves.push({ row: jumpRow, col: jumpCol })
            }
          }
        }
      }
    }

    return moves
  }

  const movePiece = (from: Position, to: Position) => {
    const newBoard = JSON.parse(JSON.stringify(board))
    const piece = newBoard[from.row][from.col].piece
    const isKing = newBoard[from.row][from.col].isKing

    // Mover a peça
    newBoard[to.row][to.col].piece = piece
    newBoard[to.row][to.col].isKing = isKing
    newBoard[from.row][from.col].piece = null
    newBoard[from.row][from.col].isKing = false

    // Verificar se é uma captura (movimento de 2 casas)
    if (Math.abs(from.row - to.row) === 2) {
      const capturedRow = (from.row + to.row) / 2
      const capturedCol = (from.col + to.col) / 2
      const capturedPiece = newBoard[capturedRow][capturedCol].piece

      if (capturedPiece) {
        // Remover a peça capturada
        newBoard[capturedRow][capturedCol].piece = null
        newBoard[capturedRow][capturedCol].isKing = false

        // Atualizar contagem de peças capturadas
        const newCapturedPieces = { ...capturedPieces }
        if (capturedPiece === "red") {
          newCapturedPieces.red += 1
        } else {
          newCapturedPieces.black += 1
        }
        setCapturedPieces(newCapturedPieces)

        // Verificar se o jogo acabou
        if (newCapturedPieces.red === 12) {
          setGameStatus("Jogador Preto venceu!")
        } else if (newCapturedPieces.black === 12) {
          setGameStatus("Jogador Vermelho venceu!")
        }
      }
    }

    // Verificar se a peça se tornou um rei
    if ((piece === "red" && to.row === 0) || (piece === "black" && to.row === 7)) {
      newBoard[to.row][to.col].isKing = true
    }

    setBoard(newBoard)
    setCurrentPlayer(currentPlayer === "red" ? "black" : "red")
    setGameStatus(`Vez do jogador: ${currentPlayer === "red" ? "Preto" : "Vermelho"}`)
  }

  const isSquareSelected = (row: number, col: number) => {
    return selectedPiece?.row === row && selectedPiece?.col === col
  }

  const isValidMove = (row: number, col: number) => {
    return possibleMoves.some((move) => move.row === row && move.col === col)
  }

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-red-500"></div>
          <span className="text-sm text-gray-700 dark:text-gray-300">Vermelho: {12 - capturedPieces.red} peças</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-gray-800 dark:bg-gray-300"></div>
          <span className="text-sm text-gray-700 dark:text-gray-300">Preto: {12 - capturedPieces.black} peças</span>
        </div>
      </div>

      <div className="text-center mb-4">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{gameStatus}</p>
      </div>

      <div className="grid grid-cols-8 gap-1 max-w-md mx-auto border-2 border-amber-800 dark:border-amber-700 p-1 bg-amber-800 dark:bg-amber-900">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`h-10 w-10 md:h-12 md:w-12 flex items-center justify-center cursor-pointer transition-all duration-200 ${
                (rowIndex + colIndex) % 2 === 0 ? "bg-amber-200 dark:bg-amber-300" : "bg-amber-800 dark:bg-amber-900"
              } ${isSquareSelected(rowIndex, colIndex) ? "ring-2 ring-blue-500 ring-inset" : ""} ${
                isValidMove(rowIndex, colIndex)
                  ? "ring-2 ring-green-500 ring-inset hover:bg-green-100 dark:hover:bg-green-900"
                  : ""
              } ${cell.piece === currentPlayer ? "hover:bg-blue-100 dark:hover:bg-blue-900" : ""}`}
              onClick={() => handleSquareClick(rowIndex, colIndex)}
            >
              {cell.piece && (
                <div
                  className={`h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center ${
                    cell.piece === "red"
                      ? "bg-red-500 border-2 border-red-700"
                      : "bg-gray-800 border-2 border-gray-900 dark:bg-gray-300 dark:border-gray-400"
                  } ${cell.piece === currentPlayer ? "hover:opacity-80 active:opacity-70" : ""}`}
                >
                  {cell.isKing && <Crown className="h-4 w-4 text-yellow-300" />}
                </div>
              )}
            </div>
          )),
        )}
      </div>

      <div className="mt-4 flex justify-center">
        <Button
          onClick={initializeBoard}
          variant="outline"
          className="hover:bg-gray-200/50 dark:hover:bg-gray-700/50 active:bg-gray-300/50 dark:active:bg-gray-600/50"
        >
          Reiniciar Jogo
        </Button>
      </div>
    </div>
  )
}
