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

const SEMANA_MIN = 22;   // mesma lógica original
const SEMANA_MAX = 99;   // mesma lógica original
const MAX_TENTATIVAS_BUSCA = 15; // limite pra não tentar 80 semanas à toa

// cache simples de pré-carregamento por path
const cacheImagens = new Map();

function gerarIdSetor(nome) {
  return nome.toLowerCase().replace(/\s+/g, "");
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
    const setor = { nome, pontos, id: gerarIdSetor(nome) };
    botao.onclick = () => trocarImagem(setor, botao);
    container.appendChild(botao);

    if (index === 0) {
      botao.classList.add("ativo");
      botaoSelecionado = botao;
      setorAtual = setor;
      document.getElementById("setorImagem").src = `setores/${nome}.png`;
      document.getElementById("setorImagem").alt = `Imagem do ${nome}`;
      gerarPontos(setorAtual);
    }
  });
}

function trocarImagem(setor, botao) {
  if (setorAtual?.nome === setor.nome) {
    if (pontoAtual !== null) {
      pontoAtual = null;
      imagemAtual = null;
      document.getElementById("setorImagem").src = `setores/${setor.nome}.png`;
      document.getElementById("setorImagem").alt = `Imagem do ${setor.nome}`;
      document.getElementById("legendaImagem").textContent = "";
      document.getElementById("navButtons").style.display = "none";
    }
    return;
  }

  if (botaoSelecionado) botaoSelecionado.classList.remove("ativo");
  botao.classList.add("ativo");
  botaoSelecionado = botao;
  setorAtual = setor;
  pontoAtual = null;
  imagemAtual = null;

  document.getElementById("setorImagem").src = `setores/${setor.nome}.png`;
  document.getElementById("setorImagem").alt = `Imagem do ${setor.nome}`;
  document.getElementById("legendaImagem").textContent = "";
  document.getElementById("navButtons").style.display = "none";

  gerarPontos(setor);
}

function gerarPontos(setor) {
  const container = document.getElementById("pontosContainer");
  container.innerHTML = "";
  document.getElementById("tituloPontos").style.display = "block";

  for (let i = 1; i <= setor.pontos; i++) {
    const ponto = document.createElement("div");
    ponto.classList.add("ponto");
    ponto.innerText = i;
    ponto.onclick = () => {
      document.querySelectorAll(".ponto").forEach((p) =>
        p.classList.remove("ativo")
      );
      ponto.classList.add("ativo");
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
    document.getElementById("setorImagem").src = path;
    document.getElementById("setorImagem").alt = "Imagem não disponível";
    document.getElementById("navButtons").style.display = "none";
    document.getElementById("legendaImagem").textContent =
      "Nenhuma imagem encontrada";
  };
  test.onerror = () => {
    if (token !== ultimoToken) return;
    buscarPrimeiraImagem(semanaAtual, token, 0);
  };
  test.src = path;
}

// agora limitamos quantas semanas vão ser testadas
function buscarPrimeiraImagem(numero, token, tentativas) {
  if (numero < SEMANA_MIN || tentativas > MAX_TENTATIVAS_BUSCA) {
    if (token !== ultimoToken) return;
    document.getElementById("setorImagem").src = "";
    document.getElementById("setorImagem").alt = "Imagem não disponível";
    document.getElementById("navButtons").style.display = "none";
    document.getElementById("legendaImagem").textContent =
      "Nenhuma imagem encontrada";
    return;
  }

  const path = `pontos/${setorAtual.id}${pontoAtual}/w${numero}.jpg`;
  testarImagem(path, (existe) => {
    if (token !== ultimoToken) return;
    if (existe) {
      imagemAtual = numero;
      exibirImagemAtual();
      document.getElementById("navButtons").style.display = "flex";
      // pré-carrega vizinhas para navegação rápida
      preCarregarVizinhanca(numero);
    } else {
      buscarPrimeiraImagem(numero - 1, token, tentativas + 1);
    }
  });
}

function exibirImagemAtual() {
  const path = `pontos/${setorAtual.id}${pontoAtual}/w${imagemAtual}.jpg`;
  document.getElementById("setorImagem").src = path;
  document.getElementById("setorImagem").alt = `Ponto ${pontoAtual} - ${setorAtual.nome} - w${imagemAtual}`;
  document.getElementById("legendaImagem").textContent =
    `${setorAtual.nome.toUpperCase()} - PONTO ${pontoAtual} - SEMANA ${imagemAtual}`;
}

function navegarImagem(direcao) {
  if (imagemAtual === null) return;
  const proximo = imagemAtual + direcao;
  if (proximo < SEMANA_MIN || proximo > SEMANA_MAX) return;
  ultimoToken++;
  verificarImagem(proximo, direcao, ultimoToken, 0);
}

function verificarImagem(numero, direcao, token, tentativas) {
  if (numero < SEMANA_MIN || numero > SEMANA_MAX || tentativas > MAX_TENTATIVAS_BUSCA) {
    return;
  }

  const path = `pontos/${setorAtual.id}${pontoAtual}/w${numero}.jpg`;
  testarImagem(path, (existe) => {
    if (token !== ultimoToken) return;
    if (existe) {
      imagemAtual = numero;
      exibirImagemAtual();
      preCarregarVizinhanca(numero);
    } else {
      verificarImagem(numero + direcao, direcao, token, tentativas + 1);
    }
  });
}

// função de teste com cache para não ficar rebatendo a mesma URL
function testarImagem(path, callback) {
  if (cacheImagens.has(path)) {
    callback(cacheImagens.get(path));
    return;
  }

  const img = new Image();
  img.onload = () => {
    cacheImagens.set(path, true);
    callback(true);
  };
  img.onerror = () => {
    cacheImagens.set(path, false);
    callback(false);
  };
  img.src = path;
}

// pré-carrega semanas próximas (ex: atual ±2)
function preCarregarVizinhanca(semanaBase) {
  const alvos = [semanaBase - 2, semanaBase - 1, semanaBase + 1, semanaBase + 2];
  alvos.forEach((num) => {
    if (num < SEMANA_MIN || num > SEMANA_MAX) return;
    const path = `pontos/${setorAtual.id}${pontoAtual}/w${num}.jpg`;
    if (cacheImagens.has(path)) return;
    const img = new Image();
    img.onload = () => cacheImagens.set(path, true);
    img.onerror = () => cacheImagens.set(path, false);
    img.src = path;
  });
}

function getWeekNumber(date) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
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
