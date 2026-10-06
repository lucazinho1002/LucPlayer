const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'db', 'musics.json');
const musicList = document.getElementById('musicList');
const btnAdd = document.getElementById('btnAdd');
const fileInput = document.getElementById('fileInput');

function carregarMusicas() {
  musicList.innerHTML = '';

  if (!fs.existsSync(dbPath)) {
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    fs.writeFileSync(dbPath, JSON.stringify([]));
  }

  const data = fs.readFileSync(dbPath, 'utf-8');
  const musicas = JSON.parse(data || '[]');

  musicas.forEach(musica => {
    const item = document.createElement('div');
    item.className = 'item-musica';
    item.textContent = musica.name;
    musicList.appendChild(item);
  });
}

btnAdd.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const data = fs.readFileSync(dbPath, 'utf-8');
  const musicas = JSON.parse(data || '[]');

  const novaMusica = {
    name: file.name,
    path: file.path
  };

  musicas.push(novaMusica);

  fs.writeFileSync(dbPath, JSON.stringify(musicas, null, 2));

  e.target.value = '';
  carregarMusicas();
});

carregarMusicas();