const { shell } = require('electron');
const fs = require('fs');
const path = require('path');

const btnBack = document.getElementById('btnBack');
const btnAddMilk = document.getElementById('btnAddMilk');
const statusMsg = document.getElementById('statusMsg');

// Caminho para a pasta milk (Player/milk)
const milkDir = path.join(__dirname, '..', 'milk');

// Garante que a pasta milk existe
if (!fs.existsSync(milkDir)) {
  fs.mkdirSync(milkDir, { recursive: true });
}

// Botão Voltar para index.html
btnBack.addEventListener('click', () => {
  window.location.href = 'index.html';
});

// Abre a pasta milk diretamente no Explorador de Ficheiros
btnAddMilk.addEventListener('click', () => {
  shell.openPath(milkDir).then((error) => {
    if (error) {
      statusMsg.textContent = 'Erro ao abrir a pasta milk.';
      statusMsg.style.color = '#ff4d4d';
    } else {
      statusMsg.textContent = 'Pasta milk aberta! Cole os seus ficheiros .milk lá dentro.';
      statusMsg.style.color = '#00ff7f';
    }
  });
});