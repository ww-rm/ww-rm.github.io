const PROXY_DOMAIN = "i.pixiv.re";
const puzzleContainer = document.getElementsByClassName("puzzle-container")[0];
const piecesContainer = document.getElementsByClassName("puzzle-piece-container")[0];
const puzzleReport = document.getElementById("puzzle-report");

// puzzle 数据
let illustInfo = null;

// puzzle 状态
let isSolved = false;
let stepCount = 0;

function showPuzzleReport() {
    const originalUrl = illustInfo.urls[0].urls.original.replace("i.pximg.net", PROXY_DOMAIN);

    puzzleReport.style.display = "";
    puzzleReport.innerHTML = `
        <div class="game-info">
            <span>🎉🎉🎉拼图已完成, 共计 ${stepCount} 步, <a href="${originalUrl}" target="_blank" rel="noopener noreferrer">点我查看原图</a>🎉🎉🎉</span>
        </div>
        <div class="flex-line">
            <span><span class="report-label">标题: </span>${illustInfo.illustTitle}</span>
            <span><span class="report-label">作者: </span>${illustInfo.userName}</span>
        </div>
        <div class="flex-line">
            <a href="https://pixiv.net/artworks/${illustInfo.illustId}" target="_blank" rel="noopener noreferrer">
                <span class="report-label">PID: </span><span>${illustInfo.illustId}</span>
            </a>
            <a href="https://www.pixiv.net/users/${illustInfo.userId}" target="_blank" rel="noopener noreferrer">
                <span class="report-label">UID: </span><span>${illustInfo.userId}</span>
            </a>
        </div>
        <div class="flex-line">
            <span class="report-label">标签: </span>${illustInfo.tags.map(e => `<span># ${e}</span>`).join("")}
        </div>`;
}

/** 拼图 UI 响应尺寸变化 */
function updatePieceContainerSize() {
    // 动态响应拼图框的尺寸变化
    const containerH = puzzleContainer.clientHeight;
    const containerW = puzzleContainer.clientWidth;
    const aspectRatioFather = containerW / containerH;
    const aspectRatioChild = Number(piecesContainer.dataset.ratio) || 1;

    if (aspectRatioFather > aspectRatioChild) {
        piecesContainer.style.width = `${containerH * aspectRatioChild}px`;
        piecesContainer.style.height = `${containerH}px`;
    } else {
        piecesContainer.style.width = `${containerW}px`;
        piecesContainer.style.height = `${containerW / aspectRatioChild}px`;
    }

    // 更新拼图块的尺寸和背景图裁剪
    const pieces = document.querySelectorAll('.puzzle-piece');
    const puzzleW = piecesContainer.clientWidth;
    const puzzleH = piecesContainer.clientHeight;
    const pieceW = puzzleW / 3;
    const pieceH = puzzleH / 3;

    pieces.forEach(piece => {
        if (piece.classList.contains("empty")) return;
        const xOffset = -(piece.dataset.col * pieceW);
        const yOffset = -(piece.dataset.row * pieceH);
        piece.style.backgroundSize = `${puzzleW}px ${puzzleH}px`;
        piece.style.backgroundPosition = `${xOffset}px ${yOffset}px`;
    });
}

/** 生成随机可解初始状态 */
function generateRandomPuzzle() {
    const state = [0, 1, 2, 3, 4, 5, 6, 7];

    while (true) {
        for (let i = 0; i < 100; i++) {
            state.sort(() => Math.random() - 0.5);
        }
        let invCount = 0;
        for (let i = 0; i < 8; i++) {
            for (let j = i + 1; j < 8; j++) {
                if (state[i] > state[j]) {
                    invCount++;
                }
            }
        }
        if (invCount % 2 === 1) {
            let tmp = state[0];
            state[0] = state[1];
            state[1] = tmp;
        }
        let isok = false;
        state.forEach((value, index) => {
            if (value !== index) isok = true;
        });
        if (isok) break;
    }
    state.push(8);
    return state;
}

/** 点击拼图块 */
function clickPiece(event) {
    if (isSolved) return;

    // 获取 piecesContainer 子元素列表
    const piecesList = Array.from(piecesContainer.children);
    const curPiece = this;
    const emptyPiece = document.querySelector(".puzzle-piece.empty");

    // 找到当前块和空块在 piecesContainer 中的位置
    const curIdx = piecesList.indexOf(curPiece);
    const curRow = Math.floor(curIdx / 3);
    const curCol = curIdx % 3;
    const emptyIdx = piecesList.indexOf(emptyPiece);
    const emptyRow = Math.floor(emptyIdx / 3);
    const emptyCol = emptyIdx % 3;

    // 判断是否相邻，检查当前块和空白块是否相邻
    if ((curRow === emptyRow && Math.abs(curCol - emptyCol) === 1) ||
        (curCol === emptyCol && Math.abs(curRow - emptyRow) === 1)) {

        // 交换位置
        if (curIdx < emptyIdx) {
            piecesContainer.insertBefore(emptyPiece, curPiece);
            piecesContainer.insertBefore(curPiece, piecesList[emptyIdx + 1] || null);
        } else {
            piecesContainer.insertBefore(curPiece, emptyPiece);
            piecesContainer.insertBefore(emptyPiece, piecesList[curIdx + 1] || null);
        }

        // 步数增加
        stepCount++;

        // 判断拼图是否完成
        isSolved = true;
        document.querySelectorAll('.puzzle-piece').forEach((piece, index) => {
            if (Number(piece.dataset.index) !== index)
                isSolved = false;
        });

        // 完成拼图
        if (isSolved) {
            finishPuzzle();
        }
    }
}

/** 初始化拼图 */
function initPuzzle() {
    const pageInfo = illustInfo.urls[0];
    const imgUrl = pageInfo.urls.small.replace("i.pximg.net", PROXY_DOMAIN)
    const imgWidth = pageInfo.width;
    const imgHeight = pageInfo.height;

    isSolved = false;
    stepCount = 0;

    puzzleReport.style.display = "none";
    puzzleReport.innerHTML = "";
    piecesContainer.innerHTML = "";
    piecesContainer.dataset.ratio = imgWidth / imgHeight;

    // 动态生成九宫格碎片
    const pieces = [];
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            const index = row * 3 + col;
            const piece = document.createElement("div");
            piece.classList.add("puzzle-piece");
            piece.dataset.row = row;
            piece.dataset.col = col;
            piece.dataset.index = index;

            if (index < 8) {
                piece.onclick = clickPiece;
                piece.style.backgroundImage = `url(${imgUrl})`;
            } else {
                // 最后一个块作为空白块
                piece.classList.add("empty");
            }
            pieces.push(piece);
        }
    }

    // 随机打乱拼图
    const state = generateRandomPuzzle();
    state.forEach(idx => piecesContainer.appendChild(pieces[idx]));

    updatePieceContainerSize();
}

/** 重置当前拼图状态 */
function resetPuzzle() {
    isSolved = false;
    stepCount = 0;
    const pieces = Array.from(document.querySelectorAll('.puzzle-piece'));
    const state = generateRandomPuzzle();
    piecesContainer.innerHTML = "";
    state.forEach(idx => piecesContainer.appendChild(pieces[idx]));
}

/** 拼图完成 */
function finishPuzzle() {
    showPuzzleReport();
}

/** 初始化拼图游戏 */
function initGame() {
    const xhrDateList = new XMLHttpRequest();
    xhrDateList.open("GET", "/pixivrank/index.txt", true);
    xhrDateList.responseType = "text";
    xhrDateList.onload = function () {
        if (xhrDateList.status === 200) {
            const dateList = xhrDateList.response.trim().split("\n").map(line => line.trim()); // 每一行为一个日期, 格式为YYYYMMDD
            const randomDate = dateList[Math.floor(Math.random() * dateList.length)];
            const datePart = `${randomDate.slice(0, 4)}/${randomDate.slice(4, 6)}/${randomDate.slice(6, 8)}`;
            const xhrIllust = new XMLHttpRequest();
            xhrIllust.open("GET", `/pixivrank/${datePart}/monthly.json`, true);
            xhrIllust.responseType = "json";
            xhrIllust.onload = function () {
                if (xhrIllust.status === 200) {
                    const illustList = xhrIllust.response.illusts;
                    illustInfo = illustList[Math.floor(Math.random() * illustList.length)];
                    initPuzzle();
                } else {
                    alert("数据获取失败！");
                }
            };
            xhrIllust.onerror = function () { alert("数据获取失败！"); };
            xhrIllust.send();
        } else {
            alert("数据获取失败！");
        }
    };
    xhrDateList.onerror = function () { alert("数据获取失败！"); };
    xhrDateList.send();
}

function init() {
    document.getElementById("puzzle-actions").innerHTML = [
        `<span>不合XP? <a href="javascript:void(0);" id="change-puzzle">换一张<i class="fa fa-shuffle fa-fw" aria-hidden="true"></i></a></span>`,
        `<span>太难了? <a href="javascript:void(0);" id="reset-puzzle">重开一次<i class="fa fa-refresh fa-fw" aria-hidden="true"></a></span>`,
    ].join("<span>|</span>");
    // 动态设置拼图区域大小
    (new ResizeObserver(updatePieceContainerSize)).observe(puzzleContainer);
    document.getElementById("change-puzzle").onclick = initGame;
    document.getElementById("reset-puzzle").onclick = resetPuzzle;
    initGame();
}

init();
