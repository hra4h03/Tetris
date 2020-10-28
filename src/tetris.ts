import { Z, S, T, O, L, I, J, X } from "./tetrominoes";

const cvs = document.getElementById("tetris") as HTMLCanvasElement
const ctx = cvs.getContext("2d")!;
const start = document.getElementById("start");
const scoreElement = document.getElementById("score");

const COLOR_PALLET = {
  _BG_: "rgb(1,22,39)",
  BLACK: "rgb(28,120,192)",
  VACANT: "rgb(198,222,221)",
  RED: "rgb(229,62,62)",
  GREEN: "rgb(47,133,90)",
  YELLOW: "rgb(246,224,94)",
  BLUE: "rgb(44,82,130)",
  PURPLE: "rgb(184,50,128)",
  CYAN: "rgb(163,191,250)",
  ORANGE: "rgb(237,137,54)",
};
type IColor = keyof typeof COLOR_PALLET

class Game {
  static SQ: number
  COL: number = 10
  ROW: number = 20
  BOARD: IColor[][]
  private GameOver: boolean = false
  get game_over() {
    return this.GameOver 
  }
  set game_over(bool) {
    this.GameOver = bool
  }

  private Score = 0
  get score() {
    return this.Score 
  }
  add_score(val = 10) {
    this.Score += val
    scoreElement!.innerText = this.Score.toString() 
  }  

  static drawSquare(x: number, y: number, color: IColor) {
    ctx.fillStyle = COLOR_PALLET[color];
    ctx.fillRect(x * Game.SQ, y * Game.SQ, Game.SQ - 1.5, Game.SQ - 1.5);
    ctx.strokeStyle  = COLOR_PALLET['_BG_']
    ctx.strokeRect(x * Game.SQ, y * Game.SQ, Game.SQ, Game.SQ);
  }
  draw() {
    for (let r = 0; r < this.ROW; r++) {
      for (let c = 0; c < this.COL; c++) {
        Game.drawSquare(c, r, this.BOARD[r][c]);
      }
    }
  }

  resize() {
    if (window.innerHeight < window.innerWidth) {
      cvs.height = window.innerHeight;
      cvs.width = (window.innerHeight) / 2;
    } else {
      cvs.height = window.innerWidth;
      cvs.width = (window.innerWidth) / 2;
    }
    Game.SQ = cvs.height / this.ROW;
    this.draw()
  };


  constructor(row = 20, col = 10) {
    this.COL = col;
    this.ROW = row;
    this.BOARD = [];
    for (let r = 0; r < this.ROW; r++) {
      this.BOARD[r] = [];
      for (let c = 0; c < this.COL; c++) {
        this.BOARD[r][c] = "VACANT";
      }
    }
    window.addEventListener("resize", () => this.resize());
    this.resize()
  }
}

const game_instance = new Game();
game_instance.draw();

class Piece {
  static Tetrominoes: Array<[number[][][], IColor]> = [
    [Z, "GREEN"],
    [S, "ORANGE"],
    [T, "YELLOW"],
    [O, "RED"],
    [L, "PURPLE"],
    [I, "CYAN"],
    [J, "BLACK"],
  ];
  static registerTetromino(tetromino:number[][][], color: IColor) {
    this.Tetrominoes.push([tetromino, color])
  } 

  static randomPiece(): Piece {
    let r = Math.floor(Math.random() * Piece.Tetrominoes.length); // 0 -> 6
    return new Piece(Piece.Tetrominoes[r][0], Piece.Tetrominoes[r][1]);
  }
  x: number = 3 
  y: number = -2
  tetrominoN = 0 
  isLocked: boolean = false

  static p = Piece.randomPiece()

  activeTetromino: number[][] 
  constructor(
    public tetromino: number[][][], 
    public color: IColor
  ) {
    this.activeTetromino = this.tetromino[this.tetrominoN];
  }

  fill(color: IColor) {
    for (let r = 0; r < this.activeTetromino.length; r++) {
      for (let c = 0; c < this.activeTetromino.length; c++) {
        // we draw only occupied squares
        if (this.activeTetromino[r][c]) {
          Game.drawSquare(this.x + c, this.y + r, color);
        }
      }
    }
  }
  draw() { this.fill(this.color) }
  unDraw() { this.fill('VACANT') }

  shadowDown() {
    while(!this.isLocked) {
      Piece.p.moveDown()
    } 
  }

  moveDown() {
    if (!this.collision(0, 1, this.activeTetromino)) {
      this.unDraw();
      this.y++;
      this.draw();
    } else {
      // we lock the piece and generate a new one
      this.lock();
      Piece.p = Piece.randomPiece()
    }
  }

  moveRight() {
    if (!this.collision(1, 0, this.activeTetromino)) {
      this.unDraw();
      this.x++;
      this.draw();
    }
  };

  // move Left the piece
  moveLeft() {
    if (!this.collision(-1, 0, this.activeTetromino)) {
      this.unDraw();
      this.x--;
      this.draw();
    }
  };

  // rotate the piece
  rotate() {
    let nextPattern = this.tetromino[
      (this.tetrominoN + 1) % this.tetromino.length
    ];
    let kick = 0;

    if (this.collision(0, 0, nextPattern)) {
      if (this.x > game_instance.COL / 2) {
        // it's the right wall
        kick = -1; // we need to move the piece to the left
      } else {
        // it's the left wall
        kick = 1; // we need to move the piece to the right
      }
    }

    if (!this.collision(kick, 0, nextPattern)) {
      this.unDraw();
      this.x += kick;
      this.tetrominoN = (this.tetrominoN + 1) % this.tetromino.length; // (0+1)%4 => 1
      this.activeTetromino = this.tetromino[this.tetrominoN];
      this.draw();
    }
  }
  lock() {
    this.isLocked = true
    for (let r = 0; r < this.activeTetromino.length; r++) {
      for (let c = 0; c < this.activeTetromino.length; c++) {
        // we skip the vacant squares
        if (!this.activeTetromino[r][c]) {
          continue;
        }
        // pieces to lock on top = game over
        if (this.y + r < 0) {
          alert("Game Over");
          // stop request animation frame
          game_instance.game_over = true;
          break;
        }
        // we lock the piece
        game_instance.BOARD[this.y + r][this.x + c] = this.color;
      }
    }
    // remove full rows
    for (let r = 0; r < game_instance.ROW; r++) {
      let isRowFull = true;
      for (let c = 0; c < game_instance.COL; c++) {
        isRowFull = isRowFull && game_instance.BOARD[r][c] !== 'VACANT';
      }
      if (isRowFull) {
        // if the row is full
        // we move down all the rows above it
        for (let y = r; y > 1; y--) {
          for (let c = 0; c < game_instance.COL; c++) {
            game_instance.BOARD[y][c] = game_instance.BOARD[y - 1][c];
          }
        }
        // the top row board[0][..] has no row above it
        for (let c = 0; c < game_instance.COL; c++) {
          game_instance.BOARD[0][c] = 'VACANT';
        }
        // increment the score
        game_instance.add_score(10);
      }
    }
    // update the board
    game_instance.draw();
  }
  collision(x: number, y: number, piece: typeof Piece.Tetrominoes[0][0][0]) {
    for (let r = 0; r < piece.length; r++) {
      for (let c = 0; c < piece.length; c++) {
        // if the square is empty, we skip it
        if (!piece[r][c]) continue;
        // coordinates of the piece after movement
        let newX = this.x + c + x;
        let newY = this.y + r + y;

        // conditions
        if (newX < 0 || newX >= game_instance.COL || newY >= game_instance.ROW) {
          return true;
        }
        // skip newY < 0; board[-1] will crush our game
        if (newY < 0) continue;
        // check if there is a locked piece alrady in place
        if (game_instance.BOARD[newY][newX] !== 'VACANT') {
          return true;
        }
      }
    }
    return false;
  }
}




document.addEventListener("keydown", (e) => CONTROL(e.keyCode));
document.addEventListener("swiped-up", () => CONTROL(38))
document.addEventListener("swiped-down", () => CONTROL(40))
document.addEventListener("swiped-left", () => CONTROL(37))
document.addEventListener("swiped-right", () => CONTROL(39));
document.addEventListener("long-press", () => CONTROL(32))

function CONTROL(keyCode: number) {
  switch (keyCode) {
    case 32:
      Piece.p.shadowDown();
      break;
    case 37:
      Piece.p.moveLeft();
      dropStart = Date.now();
      break;
    case 38:
      Piece.p.rotate();
      dropStart = Date.now();
      break;  
    case 39:
      Piece.p.moveRight();
      dropStart = Date.now();
      break;
    case 40:
      Piece.p.moveDown();
      break;  
  }
}

// drop the piece every 1sec

let dropStart = Date.now();
function drop() {
  let now = Date.now();
  let delta = now - dropStart;
  if (delta > 1000) {
    Piece.p.moveDown();
    dropStart = Date.now();
  }
  if (!game_instance.game_over) {
    requestAnimationFrame(drop);
  }
}
start!.addEventListener("click", drop);
