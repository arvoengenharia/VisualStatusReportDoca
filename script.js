const senhaHash = "3b8b122ab7192a110bc6b9a31b16caece92a42383145b62ccaf9b0028a69ae64";

const loginForm = document.getElementById("loginForm");
const senhaInput = document.getElementById("senhaInput");
const loginError = document.getElementById("loginError");

document.getElementById("appContent").style.display = "none";
document.getElementById("loginPage").style.display = "flex";

loginForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const senha = senhaInput.value.trim();
  loginError.textContent = "";
  const hashDigitado = CryptoJS.SHA256(senha).toString(CryptoJS.enc.Hex);

  if (hashDigitado === senhaHash) {
    localStorage.setItem("senhaSalva", senha);
    localStorage.setItem("ultimoLogin", Date.now());

    document.getElementById("loginPage").style.display = "none";
    document.getElementById("appContent").style.display = "flex";
    carregarSetores();
    setTimeout(() => {
      senhaInput.value = "";
    }, 200);
  } else {
    loginError.textContent = "Senha incorreta.";
  }
});

let imagemAtual = null,
  setorAtual = null,
  pontoAtual = null,
  botaoSelecionado = null,
  ultimoToken = 0;

function gerarIdSetor(nome) {
  return nome.toLowerCase().replace(/\s+/g, '');
}

async function carregarSetores() {
  const setoresTag = document.getElementById("setores-json");
  const setoresJson = JSON.parse(setoresTag.textContent);
  const setoresArray = Object.entries(setoresJson);

  const container = document.getElementById("setoresContainer");
  container.innerHTML = "";

  setoresArray.forEach(([nome, pontos], index) => {
    const botao = document.createElement("button");
    botao.textContent = nome.toUpperCase();
    botao.onclick = () => trocarImagem({ nome, pontos, id: gerarIdSetor(nome) }, botao);
    container.appendChild(botao);

    if (index === 0) {
      botao.classList.add("ativo");
      botaoSelecionado = botao;
      setorAtual = { nome, pontos, id: gerarIdSetor(nome) };
      document.getElementById('setorImagem').src = `setores/${nome}.png`;
      document.getElementById('setorImagem').alt = `Imagem do ${nome}`;
      gerarPontos(setorAtual);
    }
  });
}

function trocarImagem(setor, botao) {
  if (setorAtual?.nome === setor.nome) {
    if (pontoAtual !== null) {
      pontoAtual = null;
      imagemAtual = null;
      document.getElementById('setorImagem').src = `setores/${setor.nome}.png`;
      document.getElementById('setorImagem').alt = `Imagem do ${setor.nome}`;
      document.getElementById('legendaImagem').textContent = '';
      document.getElementById('navButtons').style.display = 'none';
    }
    return;
  }

  if (botaoSelecionado) botaoSelecionado.classList.remove('ativo');
  botao.classList.add('ativo');
  botaoSelecionado = botao;
  setorAtual = setor;
  pontoAtual = null;
  imagemAtual = null;

  document.getElementById('setorImagem').src = `setores/${setor.nome}.png`;
  document.getElementById('setorImagem').alt = `Imagem do ${setor.nome}`;
  document.getElementById('legendaImagem').textContent = '';
  document.getElementById('navButtons').style.display = 'none';

  gerarPontos(setor);
}


function gerarPontos(setor) {
  const container = document.getElementById('pontosContainer');
  container.innerHTML = '';
  document.getElementById('tituloPontos').style.display = 'block';

  for (let i = 1; i <= setor.pontos; i++) {
    const ponto = document.createElement('div');
    ponto.classList.add('ponto');
    ponto.innerText = i;
    ponto.onclick = () => {
      document.querySelectorAll('.ponto').forEach(p => p.classList.remove('ativo'));
      ponto.classList.add('ativo');
      abrirImagem(setor, i);
    };
    container.appendChild(ponto);
  }
}

function abrirImagem(setor, ponto) {
  setorAtual = setor;
  pontoAtual = ponto;
  imagemAtual = null;
  ultimoToken++;
  verificarEmptyOuBuscar(ultimoToken);
}

function verificarEmptyOuBuscar(token) {
  const path = `pontos/${setorAtual.id}${pontoAtual}/empty.jpg`;
  const test = new Image();
  test.onload = () => {
    if (token !== ultimoToken) return;
    document.getElementById('setorImagem').src = path;
    document.getElementById('setorImagem').alt = 'Imagem não disponível';
    document.getElementById('navButtons').style.display = 'none';
    document.getElementById('legendaImagem').textContent = 'Nenhuma imagem encontrada';
  };
  test.onerror = () => {
    if (token !== ultimoToken) return;
    buscarPrimeiraImagem(semanaAtual, token);
  };
  test.src = path;
}

function buscarPrimeiraImagem(numero, token) {
  if (numero < 22) {
    document.getElementById('setorImagem').src = '';
    document.getElementById('setorImagem').alt = 'Imagem não disponível';
    document.getElementById('navButtons').style.display = 'none';
    document.getElementById('legendaImagem').textContent = 'Nenhuma imagem encontrada';
    return;
  }

  const path = `pontos/${setorAtual.id}${pontoAtual}/w${numero}.jpg`;
  const test = new Image();
  test.onload = () => {
    if (token !== ultimoToken) return;
    imagemAtual = numero;
    exibirImagemAtual();
    document.getElementById('navButtons').style.display = 'flex';
  };
  test.onerror = () => {
    if (token !== ultimoToken) return;
    buscarPrimeiraImagem(numero - 1, token);
  };
  test.src = path;
}

function exibirImagemAtual() {
  const path = `pontos/${setorAtual.id}${pontoAtual}/w${imagemAtual}.jpg`;
  document.getElementById('setorImagem').src = path;
  document.getElementById('setorImagem').alt = `Ponto ${pontoAtual} - ${setorAtual.nome} - w${imagemAtual}`;
  document.getElementById('legendaImagem').textContent = `${setorAtual.nome.toUpperCase()} - PONTO ${pontoAtual} - SEMANA ${imagemAtual}`;
}

function navegarImagem(direcao) {
  if (imagemAtual === null) return;
  const proximo = imagemAtual + direcao;
  if (proximo < 22 || proximo > 99) return;
  verificarImagem(proximo, direcao, ultimoToken);
}

function verificarImagem(numero, direcao, token) {
  const path = `pontos/${setorAtual.id}${pontoAtual}/w${numero}.jpg`;
  const test = new Image();
  test.onload = () => {
    if (token !== ultimoToken) return;
    imagemAtual = numero;
    exibirImagemAtual();
  };
  test.onerror = () => {
    if (token !== ultimoToken) return;
    verificarImagem(numero + direcao, direcao, token);
  };
  test.src = path;
}

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

const hoje = new Date();
const semanaAtual = getWeekNumber(hoje);

window.onload = function () {
  const ultimoLogin = parseInt(localStorage.getItem("ultimoLogin"), 10);
  const senhaSalva = localStorage.getItem("senhaSalva");
  const agora = Date.now();

  const senhaOk =
    senhaSalva &&
    CryptoJS.SHA256(senhaSalva).toString(CryptoJS.enc.Hex) === senhaHash &&
    ultimoLogin &&
    agora - ultimoLogin < 60000;

  if (senhaOk) {
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("appContent").style.display = "flex";
    carregarSetores();
  } else {
    document.getElementById("loginPage").style.display = "flex";
    document.getElementById("appContent").style.display = "none";
  }
};
