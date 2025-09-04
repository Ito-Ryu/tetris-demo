// 1. 初期設定
const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');

const ROWS = 20; // 行数
const COLS = 10; // 列数
const BLOCK_SIZE = 30; // 1ブロックのサイズ(px)

// キャンバスのサイズを設定
canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;

// ゲームボードの状態を管理する2次元配列
let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

// テトリミノの形を定義
const SHAPES = [
    [[1, 1, 1, 1]], // I
    [[1, 1], [1, 1]], // O
    [[0, 1, 0], [1, 1, 1]], // T
    [[0, 1, 1], [1, 1, 0]], // S
    [[1, 1, 0], [0, 1, 1]], // Z
    [[1, 0, 0], [1, 1, 1]], // J
    [[0, 0, 1], [1, 1, 1]], // L
    [[1, 0, 1], [1, 1 ,1]],  // U
    [[1, 0, 1], [0, 1, 0], [1, 0, 1]] // X
];

const COLORS = [
    null,       // 0番目は空
    '#3498db',  // I: 青
    '#f1c40f',  // O: 黄
    '#9b59b6',  // T: 紫
    '#2ecc71',  // S: 緑
    '#e74c3c',  // Z: 赤
    '#e67e22',  // J: オレンジ
    '#1abc9c',  // L: ターコイズ
    '#FFFFFF',  // U: 白
    '#000000'   // X: 黒
];

// ゲームの状態
let currentTetromino;
let currentX, currentY;
let isPaused = false;
let score = 0;
const timeLimit = 60 * 1000; // 60秒
let elapsedTime = 0;

// 2. 描画関連
function draw() {
    // 全体をクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 固定されたブロックを描画
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x]) {
                ctx.fillStyle = COLORS[board[y][x]];
                ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
    }

    // 操作中のテトリミノを描画
    if (currentTetromino) {
        ctx.fillStyle = COLORS[currentTetromino.colorIndex];
        for (let y = 0; y < currentTetromino.shape.length; y++) {
            for (let x = 0; x < currentTetromino.shape[y].length; x++) {
                if (currentTetromino.shape[y][x]) {
                    ctx.fillRect((currentX + x) * BLOCK_SIZE, (currentY + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                    ctx.strokeRect((currentX + x) * BLOCK_SIZE, (currentY + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                }
            }
        }
    }

    // スコアと時間を描画
    ctx.fillStyle = 'white';
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`スコア: ${score}`, 10, 25);
    const timeLeft = Math.max(0, Math.ceil((timeLimit - elapsedTime) / 1000));
    ctx.textAlign = 'right';
    ctx.fillText(`残り時間: ${timeLeft}`, canvas.width - 10, 25);

    // ポーズ画面の描画
    if (isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    }
}

// 3. ゲームロジック
function resetGame() {
    board.forEach(row => row.fill(0));
    score = 0;
    elapsedTime = 0;
}

function newTetromino() {
    const rand = Math.floor(Math.random() * SHAPES.length);
    const shape = SHAPES[rand];
    currentTetromino = {
        shape: shape,
        colorIndex: rand + 1
    };
    currentX = Math.floor((COLS - shape[0].length) / 2);
    currentY = 0;

    // ゲームオーバー判定
    if (!isValidMove(currentTetromino.shape, currentX, currentY)) {
        alert(`ゲームオーバー！\n最終スコア: ${score}`);
        resetGame();
    }
}

function isValidMove(shape, gridX, gridY) {
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                let newX = gridX + x;
                let newY = gridY + y;
                if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && board[newY][newX])) {
                    return false;
                }
            }
        }
    }
    return true;
}

function lockTetromino() {
    for (let y = 0; y < currentTetromino.shape.length; y++) {
        for (let x = 0; x < currentTetromino.shape[y].length; x++) {
            if (currentTetromino.shape[y][x]) {
                board[currentY + y][currentX + x] = currentTetromino.colorIndex;
            }
        }
    }
    clearLines();
}

function clearLines() {
    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(cell => cell > 0)) {
            score += 1000;
            elapsedTime = Math.max(0, elapsedTime - 15000); // 15秒延長
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(0));
            y++;
        }
    }
}

// 4. 操作
function rotate() {
    const shape = currentTetromino.shape;
    const newShape = shape[0].map((_, colIndex) => shape.map(row => row[colIndex]).reverse());
    if (isValidMove(newShape, currentX, currentY)) {
        currentTetromino.shape = newShape;
    }
}

document.addEventListener('keydown', (e) => {
    if (!currentTetromino) return;

    if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        isPaused = !isPaused;
        return;
    }

    if (isPaused) return;

    if (e.key === 'ArrowLeft') {
        if (isValidMove(currentTetromino.shape, currentX - 1, currentY)) { currentX--; }
    } else if (e.key === 'ArrowRight') {
        if (isValidMove(currentTetromino.shape, currentX + 1, currentY)) { currentX++; }
    } else if (e.key === 'ArrowDown') {
        if (isValidMove(currentTetromino.shape, currentX, currentY + 1)) {
            currentY++;
        } else {
            lockTetromino();
            newTetromino();
        }
    } else if (e.key === 'ArrowUp') {
        rotate();
    }
});

// 5. ゲームループ
let lastTime = 0;
let dropCounter = 0;
let dropInterval = 1000; // 1秒ごとに落下

function gameLoop(time = 0) {
    if (!isPaused) {
        const deltaTime = time - lastTime;
        lastTime = time;
        elapsedTime += deltaTime;

        if (elapsedTime >= timeLimit) {
            alert(`時間切れ！\n最終スコア: ${score}`);
            resetGame();
        }

        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            if (isValidMove(currentTetromino.shape, currentX, currentY + 1)) {
                currentY++;
            } else {
                lockTetromino();
                newTetromino();
            }
            dropCounter = 0;
        }
    }

    draw();
    requestAnimationFrame(gameLoop);
}

// ゲーム開始
newTetromino();
gameLoop();
