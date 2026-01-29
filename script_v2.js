// DOM要素
const dropZone = document.getElementById('dropZone');
const modal = document.getElementById('modal');
const closeBtn = document.getElementById('closeBtn');
const virtualScroll = document.getElementById('virtualScroll');
const scrollContent = document.getElementById('scrollContent');
const terminalOutput = document.getElementById('terminalOutput');
const terminalButtons = document.getElementById('terminalButtons');
const quickViewBtn = document.getElementById('quickViewBtn');
const fullLoadBtn = document.getElementById('fullLoadBtn');
const body = document.body;

// 仮想スクロール設定
const LINE_HEIGHT = 28.8; // 1.2rem * 1.8 line-height ≒ 28.8px
const BUFFER_LINES = 50; // 表示バッファ（前後50行）

let fileContent = '';
let lines = [];
let visibleStartIndex = 0;
let visibleEndIndex = 0;
let currentFile = null;
let isFirstTime = true; // 初回判定フラグ

// タイプライター効果
async function typeWriter(text, element, speed = 30) {
    for (let i = 0; i < text.length; i++) {
        element.textContent += text[i];
        await new Promise(resolve => setTimeout(resolve, speed));
    }
}

// ターミナル演出
async function showTerminalSequence(file) {
    currentFile = file;
    terminalOutput.textContent = '';
    terminalButtons.style.display = 'none';
    virtualScroll.style.display = 'none';
    
    // アスキーアートを表示
    const asciiArt = `
 ███╗   ██╗██╗   ██╗ █████╗ ███╗   ██╗
 ████╗  ██║╚██╗ ██╔╝██╔══██╗████╗  ██║
 ██╔██╗ ██║ ╚████╔╝ ███████║██╔██╗ ██║
 ██║╚██╗██║  ╚██╔╝  ██╔══██║██║╚██╗██║
 ██║ ╚████║   ██║   ██║  ██║██║ ╚████║
 ╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═══╝
                                        
  ██████╗ ██████╗ ██████╗ ███████╗
 ██╔════╝██╔═══██╗██╔══██╗██╔════╝
 ██║     ██║   ██║██║  ██║█████╗  
 ██║     ██║   ██║██║  ██║██╔══╝  
 ╚██████╗╚██████╔╝██████╔╝███████╗
  ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝

`;
    
    // アスキーアート表示
    const artDiv = document.createElement('div');
    if (isFirstTime) {
        // 初回：光アニメーション付き
        artDiv.className = 'ascii-art-glow';
        artDiv.textContent = asciiArt;
        terminalOutput.appendChild(artDiv);
        await new Promise(resolve => setTimeout(resolve, 2000)); // 光アニメーション時間
    } else {
        // 2回目以降：アニメーションなし
        artDiv.textContent = asciiArt;
        artDiv.style.whiteSpace = 'pre';
        artDiv.style.fontFamily = "'Courier New', monospace";
        artDiv.style.color = '#00ff00';
        artDiv.style.textShadow = '0 0 5px rgba(0, 255, 0, 0.5)';
        terminalOutput.appendChild(artDiv);
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // 区切り線
    const separator = document.createElement('div');
    separator.textContent = '─'.repeat(50);
    terminalOutput.appendChild(separator);
    terminalOutput.appendChild(document.createElement('br'));
    terminalOutput.appendChild(document.createElement('br'));
    
    if (isFirstTime) {
        // 初回：詳細メッセージ
        await typeWriter('Loading NYAN file viewer...\n', terminalOutput, 40);
        await new Promise(resolve => setTimeout(resolve, 200));
        
        await typeWriter('Initializing decryption module...\n', terminalOutput, 40);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        await typeWriter('Allocating memory buffers...\n', terminalOutput, 40);
        await new Promise(resolve => setTimeout(resolve, 250));
        
        await typeWriter('System initialized.\n', terminalOutput, 40);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        await typeWriter('Ready to decode NYAN language.\n\n', terminalOutput, 40);
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // 初回フラグをオフ
        isFirstTime = false;
    } else {
        // 2回目以降：シンプルメッセージ
        await typeWriter('READY TO DECODE?\n\n', terminalOutput, 40);
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Continue
    const continueText = document.createTextNode('[Press ENTER or CLICK to proceed]');
    terminalOutput.appendChild(continueText);
    const cursor = document.createElement('span');
    cursor.className = 'terminal-cursor';
    terminalOutput.appendChild(cursor);
    
    // ENTER キーまたはクリックを待つ
    await waitForContinue();
    
    // ファイル読み込み開始
    cursor.remove();
    terminalOutput.style.display = 'none';
    virtualScroll.style.display = 'flex';
    readFileInChunks(file);
}

// ドラッグオーバー時の処理
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    body.classList.remove('cat-eyes-normal');
    body.classList.add('cat-eyes-excited');
});

// ドラッグリーブ時の処理
dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    body.classList.remove('cat-eyes-excited');
    body.classList.add('cat-eyes-normal');
});

// ENTER または クリックを待つ
function waitForContinue() {
    return new Promise((resolve) => {
        const handleKey = (e) => {
            if (e.key === 'Enter') {
                document.removeEventListener('keydown', handleKey);
                terminalOutput.removeEventListener('click', handleClick);
                resolve();
            }
        };
        const handleClick = () => {
            document.removeEventListener('keydown', handleKey);
            terminalOutput.removeEventListener('click', handleClick);
            resolve();
        };
        document.addEventListener('keydown', handleKey);
        terminalOutput.addEventListener('click', handleClick);
        terminalOutput.style.cursor = 'pointer';
    });
}

// ボタンイベント
quickViewBtn.addEventListener('click', () => {
    terminalOutput.style.display = 'none';
    terminalButtons.style.display = 'none';
    virtualScroll.style.display = 'flex';
    readFileInChunks(currentFile);
});

fullLoadBtn.addEventListener('click', () => {
    terminalOutput.style.display = 'none';
    terminalButtons.style.display = 'none';
    virtualScroll.style.display = 'flex';
    readFullFile(currentFile);
});

// キーボードショートカット（1または2キー）
document.addEventListener('keydown', (e) => {
    if (modal.classList.contains('show') && terminalButtons.style.display !== 'none') {
        if (e.key === '1') {
            quickViewBtn.click();
        } else if (e.key === '2') {
            fullLoadBtn.click();
        }
    }
});

// ドロップ時の処理
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    body.classList.remove('cat-eyes-excited');
    body.classList.add('cat-eyes-normal');

    const files = e.dataTransfer.files;
    
    if (files.length === 0) return;
    
    const file = files[0];
    
    // .nyanファイルチェック
    if (!file.name.endsWith('.nyan')) {
        alert('🐱 .nyanファイルをドロップしてね！');
        return;
    }

    // モーダルを先に表示してダークサイドに
    modal.classList.add('show');
    body.classList.remove('cat-eyes-normal');
    body.classList.add('cat-eyes-dark');
    
    // ターミナル演出開始
    showTerminalSequence(file);
});

// モーダルを閉じる
closeBtn.addEventListener('click', () => {
    modal.classList.remove('show');
    // 全変数をリセット
    fileContent = '';
    lines = [];
    scrollContent.innerHTML = '';
    hasTyped = false;
    simpleDisplayDiv = null;
    currentFile = null;
    // ターミナル表示もリセット
    terminalOutput.textContent = '';
    terminalOutput.style.display = 'block';
    terminalButtons.style.display = 'none';
    virtualScroll.style.display = 'none';
    // 通常の目に戻す
    body.classList.remove('cat-eyes-dark');
    body.classList.add('cat-eyes-normal');
});

// モーダル外クリックで閉じる
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('show');
        // 全変数をリセット
        fileContent = '';
        lines = [];
        scrollContent.innerHTML = '';
        hasTyped = false;
        simpleDisplayDiv = null;
        currentFile = null;
        remainingFile = null;
        currentOffset = 0;
        // ターミナル表示もリセット
        terminalOutput.textContent = '';
        terminalOutput.style.display = 'block';
        terminalButtons.style.display = 'none';
        virtualScroll.style.display = 'none';
        // 通常の目に戻す
        body.classList.remove('cat-eyes-dark');
        body.classList.add('cat-eyes-normal');
    }
});

// 仮想スクロールのレンダリング
function renderVirtualScroll() {
    if (lines.length === 0) return;
    
    const scrollTop = virtualScroll.scrollTop;
    const viewportHeight = virtualScroll.clientHeight;
    
    // 表示開始・終了行を計算
    const startLine = Math.floor(scrollTop / LINE_HEIGHT);
    const endLine = Math.ceil((scrollTop + viewportHeight) / LINE_HEIGHT);
    
    // バッファを追加
    visibleStartIndex = Math.max(0, startLine - BUFFER_LINES);
    visibleEndIndex = Math.min(lines.length, endLine + BUFFER_LINES);
    
    // 表示する行を抽出
    const visibleLines = lines.slice(visibleStartIndex, visibleEndIndex);
    
    // スクロールコンテナの作成（初回のみ）
    if (!scrollContent.querySelector('.scroll-spacer')) {
        scrollContent.innerHTML = ''; // 読み込み中表示をクリア
        
        const spacer = document.createElement('div');
        spacer.className = 'scroll-spacer';
        spacer.style.writingMode = 'horizontal-tb';
        spacer.style.direction = 'ltr';
        scrollContent.appendChild(spacer);
        
        const content = document.createElement('div');
        content.className = 'scroll-text';
        // 横書き強制
        content.style.writingMode = 'horizontal-tb !important';
        content.style.direction = 'ltr !important';
        content.style.whiteSpace = 'pre-wrap';
        content.style.fontFamily = "'Courier New', monospace";
        content.style.color = '#00ff00';
        content.style.textShadow = '0 0 5px rgba(0, 255, 0, 0.5)';
        scrollContent.appendChild(content);
        
        const loading = document.createElement('div');
        loading.className = 'loading-indicator';
        loading.innerHTML = '・・・・・🐾';
        loading.style.display = 'none';
        loading.style.writingMode = 'horizontal-tb';
        loading.style.direction = 'ltr';
        scrollContent.appendChild(loading);
    }
    
    const spacer = scrollContent.querySelector('.scroll-spacer');
    const content = scrollContent.querySelector('.scroll-text');
    const loading = scrollContent.querySelector('.loading-indicator');
    
    // 毎回横書き強制（念のため）
    if (content) {
        content.style.writingMode = 'horizontal-tb';
        content.style.direction = 'ltr';
    }
    
    // 全体の高さを設定
    const totalHeight = lines.length * LINE_HEIGHT;
    spacer.style.height = `${totalHeight}px`;
    
    // 表示位置を調整
    const offsetTop = visibleStartIndex * LINE_HEIGHT;
    content.style.transform = `translateY(${offsetTop}px)`;
    
    // テキストをレンダリング（少量ずつ）
    content.textContent = visibleLines.join('\n');
    
    // スクロールが最後まで到達したかチェック
    const isAtBottom = scrollTop + viewportHeight >= totalHeight - 100;
    const isStillLoading = fileContent === '' || lines.length < 10000; // まだ読み込み中の判定
    
    if (isAtBottom && isStillLoading) {
        loading.style.display = 'block';
        loading.style.transform = `translateY(${totalHeight}px)`;
    } else {
        loading.style.display = 'none';
    }
}

// ウィンドウリサイズ時の再計算
window.addEventListener('resize', () => {
    if (modal.classList.contains('show')) {
        renderVirtualScroll();
    }
});

// チャンク読み込み関数（高速化版）
async function readFileInChunks(file) {
    const INITIAL_CHUNK = 10 * 1024; // 最初は10KBだけ（約30行分）
    
    // 最初の10KBだけ即座に読む
    const initialBlob = file.slice(0, INITIAL_CHUNK);
    const initialText = await readChunk(initialBlob);
    
    // すぐに表示開始（統計情報付き）
    fileContent = initialText;
    
    // ファイル全体の統計を概算計算
    const totalFileSize = file.size;
    const sampleWords = initialText.trim().split(/\s+/).length;
    const estimatedTotalWords = Math.floor((sampleWords / INITIAL_CHUNK) * totalFileSize);
    const estimatedTotalLines = Math.floor(estimatedTotalWords / 20);
    const remainingChars = totalFileSize - INITIAL_CHUNK;
    
    // 統計情報を含めて表示
    await processAndDisplayWithStats(fileContent, estimatedTotalLines, remainingChars);
}

// 統計情報付き表示
async function processAndDisplayWithStats(text, totalLines, remainingChars) {
    const WORDS_PER_LINE = 20;
    const words = text.trim().split(/\s+/);
    const newLines = [];
    
    // 20単語ごとに1行にまとめる
    for (let i = 0; i < words.length; i += WORDS_PER_LINE) {
        const lineWords = words.slice(i, i + WORDS_PER_LINE);
        newLines.push(lineWords.join(' '));
    }
    
    lines = newLines;
    
    // カタカタ表示 + 統計情報
    await typeWriterNyanWithStats(lines, totalLines, remainingChars);
}

// 部分的に処理して表示（逐次表示用）
let hasTyped = false; // カタカタしたかフラグ
let simpleDisplayDiv = null; // シンプル表示用

async function processAndDisplayPartial(text, isFinal) {
    const WORDS_PER_LINE = 20;
    const words = text.trim().split(/\s+/);
    const newLines = [];
    
    // 20単語ごとに1行にまとめる
    for (let i = 0; i < words.length; i += WORDS_PER_LINE) {
        const lineWords = words.slice(i, i + WORDS_PER_LINE);
        newLines.push(lineWords.join(' '));
    }
    
    lines = newLines;
    
    // 初回だけカタカタ表示
    if (!hasTyped && lines.length > 0) {
        hasTyped = true;
        await typeWriterNyan(lines);
    } else if (simpleDisplayDiv) {
        // カタカタ後はシンプル表示に追記（全文）
        simpleDisplayDiv.textContent = lines.join('\n');
    }
}

// にゃん語をカタカタ表示（統計情報付き）
async function typeWriterNyanWithStats(linesArray, totalLines, remainingChars) {
    scrollContent.innerHTML = '';
    simpleDisplayDiv = document.createElement('pre');
    simpleDisplayDiv.setAttribute('lang', 'ja');
    simpleDisplayDiv.style.cssText = `
        color: #00ff00;
        font-family: 'Courier New', 'MS Gothic', monospace !important;
        font-size: 14px;
        line-height: 1.5;
        text-shadow: 0 0 5px rgba(0, 255, 0, 0.5);
        writing-mode: horizontal-tb !important;
        -webkit-writing-mode: horizontal-tb !important;
        direction: ltr !important;
        text-orientation: mixed !important;
        white-space: pre-wrap !important;
        word-break: normal !important;
        margin: 0;
        padding: 0;
    `;
    scrollContent.appendChild(simpleDisplayDiv);
    
    // 最初の30行だけカタカタ（プレビュー）
    const previewLines = Math.min(30, linesArray.length);
    
    for (let i = 0; i < previewLines; i++) {
        const line = linesArray[i];
        for (let char of line) {
            simpleDisplayDiv.textContent += char;
            await new Promise(resolve => setTimeout(resolve, 3));
            // 自動スクロール（最下部に追従）
            scrollContent.parentElement.scrollTop = scrollContent.parentElement.scrollHeight;
        }
        simpleDisplayDiv.textContent += '\n';
    }
    
    // プレビュー終了後の統計情報
    simpleDisplayDiv.textContent += '\n';
    simpleDisplayDiv.textContent += '─'.repeat(50) + '\n';
    simpleDisplayDiv.textContent += '          --- End of preview ---\n';
    simpleDisplayDiv.textContent += `       Remaining: ${remainingChars.toLocaleString()} characters (estimated)\n`;
    simpleDisplayDiv.textContent += `       Total lines: ${totalLines.toLocaleString()} (estimated)\n`;
    simpleDisplayDiv.textContent += '─'.repeat(50) + '\n';
    
    // 統計情報表示後に最下部までスクロール
    await new Promise(resolve => setTimeout(resolve, 100));
    scrollContent.parentElement.scrollTop = scrollContent.parentElement.scrollHeight;
}

// チャンクを読み込む
function readChunk(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(blob, 'UTF-8');
    });
}

// 進捗表示を更新（右上に小さく）
function updateProgress(text) {
    let progressEl = document.getElementById('progress-indicator');
    if (!progressEl) {
        progressEl = document.createElement('div');
        progressEl.id = 'progress-indicator';
        progressEl.style.cssText = `
            position: absolute;
            top: 70px;
            right: 70px;
            background: rgba(255, 182, 193, 0.9);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9rem;
            z-index: 1001;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
        document.querySelector('.modal-content').appendChild(progressEl);
    }
    progressEl.textContent = text;
    progressEl.style.display = 'block';
}

// 進捗表示を非表示
function hideProgress() {
    const progressEl = document.getElementById('progress-indicator');
    if (progressEl) {
        progressEl.style.display = 'none';
    }
}

// 全文を読み込む
async function readFullFile(file) {
    const CHUNK_SIZE = 100 * 1024; // 100KB
    let offset = 0;
    let chunks = [];
    
    while (offset < file.size) {
        const chunk = file.slice(offset, offset + CHUNK_SIZE);
        const text = await readChunk(chunk);
        chunks.push(text);
        offset += CHUNK_SIZE;
        
        // パーセンテージ進捗表示
        const progress = Math.round((offset / file.size) * 100);
        updateProgress(`読み込み中 ${progress}% 🐱`);
        
        await new Promise(resolve => setTimeout(resolve, 5));
    }
    
    fileContent = chunks.join('');
    await processAndDisplayPartial(fileContent, true);
    hideProgress();
}