const fs = require('fs');
const path = require('path');

// Caminhos corretos na estrutura Player/db e Player/milk
const dbPath = path.join(__dirname, '..', 'db', 'musics.json');
const milkDir = path.join(__dirname, '..', 'milk');

const audioPlayer = document.getElementById('audioPlayer');
const canvas = document.getElementById('visualizer');
const songTitle = document.getElementById('songTitle');
const presetTitle = document.getElementById('presetTitle');
const playlistModal = document.getElementById('playlistModal');
const playlistContent = document.getElementById('playlistContent');
const progressBar = document.getElementById('progressBar');
const progressWrapper = document.getElementById('progressWrapper');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');

let musicas = [];
let currentIndex = -1;
let milkFiles = [];
let currentMilkIndex = 0;

let audioCtx;
let visualizerNode;

function carregarDados() {
  if (fs.existsSync(dbPath)) {
    try {
      const data = fs.readFileSync(dbPath, 'utf-8');
      musicas = JSON.parse(data || '[]');
    } catch (e) {
      console.error("Erro ao ler db/musics.json", e);
    }
  }

  if (fs.existsSync(milkDir)) {
    const files = fs.readdirSync(milkDir);
    milkFiles = files.filter(file => file.toLowerCase().endsWith('.milk'));
  }

  if (musicas.length > 0) {
    currentIndex = 0;
    tocarMusica(currentIndex);
  } else {
    songTitle.textContent = "Nenhuma música encontrada no db/musics.json";
  }

  renderPlaylist();
}

function tocarMusica(index) {
  if (index < 0 || index >= musicas.length) return;

  currentIndex = index;
  const musica = musicas[currentIndex];

  // Adiciona 'file://' para garantir que o Electron carrega o ficheiro de áudio local sem bloqueios
  let musicPath = musica.path;
  if (!musicPath.startsWith('http') && !musicPath.startsWith('file://')) {
    musicPath = `file://${musicPath}`;
  }

  audioPlayer.src = musicPath;
  songTitle.textContent = musica.name;

  audioPlayer.play().then(() => {
    iniciarVisualizador();
  }).catch((err) => {
    console.log("Aguardando interação do utilizador para tocar áudio:", err);
  });

  renderPlaylist();
}

function iniciarVisualizador() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  if (!visualizerNode) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const converter = window.milkdropPresetConverter || window.milkdrop;

    if (converter) {
      try {
        visualizerNode = converter.createVisualizer({
          audioContext: audioCtx,
          canvas: canvas
        });

        const source = audioCtx.createMediaElementSource(audioPlayer);
        source.connect(audioCtx.destination);
        visualizerNode.connectAudio(source);

        if (milkFiles.length > 0) {
          carregarPresetMilk(0);
        }

        renderFrame();
      } catch (err) {
        console.error("Erro ao inicializar o visualizador:", err);
      }
    }
  }
}

function carregarPresetMilk(index) {
  if (milkFiles.length === 0) {
    presetTitle.textContent = "Nenhum ficheiro .milk na pasta milk/";
    return;
  }

  currentMilkIndex = index;
  const fileName = milkFiles[currentMilkIndex];
  const filePath = path.join(milkDir, fileName);

  try {
    const milkContent = fs.readFileSync(filePath, 'utf-8');
    const converter = window.milkdropPresetConverter || window.milkdrop;

    if (converter && visualizerNode) {
      const parsedPreset = converter.convertPreset ? converter.convertPreset(milkContent) : milkContent;
      visualizerNode.loadPreset(parsedPreset);
      presetTitle.textContent = `Preset Milkdrop: ${fileName}`;
    }
  } catch (err) {
    console.error("Erro ao ler .milk:", err);
    presetTitle.textContent = `Erro ao ler .milk: ${fileName}`;
  }
}

function trocarPresetMilk() {
  // Re-lê os ficheiros da pasta milk caso tenham sido adicionados ficheiros novos durante a execução
  if (fs.existsSync(milkDir)) {
    milkFiles = fs.readdirSync(milkDir).filter(file => file.toLowerCase().endsWith('.milk'));
  }

  if (milkFiles.length > 0) {
    currentMilkIndex = (currentMilkIndex + 1) % milkFiles.length;
    carregarPresetMilk(currentMilkIndex);
  } else {
    presetTitle.textContent = "Adicione ficheiros .milk em Configurações";
  }
}

function renderFrame() {
  requestAnimationFrame(renderFrame);
  if (visualizerNode && visualizerNode.render) {
    visualizerNode.render();
  }
}

function renderPlaylist() {
  playlistContent.innerHTML = '';
  musicas.forEach((m, idx) => {
    const item = document.createElement('div');
    item.className = `playlist-item ${idx === currentIndex ? 'active' : ''}`;
    item.textContent = `${idx + 1}. ${m.name}`;
    item.addEventListener('click', () => tocarMusica(idx));
    playlistContent.appendChild(item);
  });
}

function formatTime(seconds) {
  if (isNaN(seconds)) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

audioPlayer.addEventListener('timeupdate', () => {
  if (audioPlayer.duration) {
    const progressPercent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progressBar.style.width = `${progressPercent}%`;
    currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
    totalTimeEl.textContent = formatTime(audioPlayer.duration);
  }
});

progressWrapper.addEventListener('click', (e) => {
  const width = progressWrapper.clientWidth;
  const clickX = e.offsetX;
  if (audioPlayer.duration) {
    audioPlayer.currentTime = (clickX / width) * audioPlayer.duration;
  }
});

window.addEventListener('resize', () => {
  if (canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
});

document.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();

  if (key === 'q') {
    if (musicas.length === 0) return;
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) prevIndex = musicas.length - 1;
    tocarMusica(prevIndex);
  } else if (key === 'e') {
    if (musicas.length === 0) return;
    let nextIndex = (currentIndex + 1) % musicas.length;
    tocarMusica(nextIndex);
  } else if (key === 'w') {
    playlistModal.style.display = (playlistModal.style.display === 'block') ? 'none' : 'block';
  } else if (key === '1') {
    trocarPresetMilk();
  }
});

carregarDados();