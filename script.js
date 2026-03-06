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

// ESTADO
let setorAtual = null;
let pontoAtual = null;
let botaoSelecionado = null;
let ultimoToken = 0;

// agora guardamos ano + semana atuais
let imagemAtualAno = null;   // AA
let imagemAtualSemana = null; // XX

// limites configuráveis
const SEMANA_MIN = 1;
const SEMANA_MAX = 53;        // semanas no ano
const ANOS_PARA_TRAS = 3;     // quantos anos pra trás procurar (ex: 2026, 2025, 2024)

// extensões aceitas
const EXTENSOES = ["jpg", "jpeg", "png"];

// cache de teste de URLs
const cacheImagens = new Map();

// ---------- SETORES / PONTOS ----------

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
      limparImagemSetor(setor);
    }
    return;
  }

  if (botaoSelecionado) botaoSelecionado.classList.remove("ativo");
  botao.classList.add("ativo");
  botaoSelecionado = botao;

  setorAtual = setor;
  limparImagemSetor(setor);
  gerarPontos(setor);
}

function limparImagemSetor(setor) {
  pontoAtual = null;
  imagemAtualAno = null;
  imagemAtualSemana = null;

  document.getElementById("setorImagem").src = `setores/${setor.nome}.png`;
  document.getElementById("setorImagem").alt = `Imagem do ${setor.nome}`;
  document.getElementById("legendaImagem").textContent = "";
  document.getElementById("navButtons").style.display = "none";
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

// ---------- ABERTURA DE IMAGEM ----------

function abrirImagem(setor, ponto) {
  setorAtual = setor;
  pontoAtual = ponto;
  imagemAtualAno = null;
  imagemAtualSemana = null;
  ultimoToken++;

  verificarEmptyOuBuscar(ultimoToken);
}

// tenta carregar empty.*; se não tiver, procura a foto mais recente
function verificarEmptyOuBuscar(token) {
  const pasta = `pontos/${setorAtual.id}${pontoAtual}`;
  const baseEmpty = `${pasta}/empty`;

  tentarComExtensoes(baseEmpty, (pathOk) => {
    if (token !== ultimoToken) return;

    if (pathOk) {
      document.getElementById("setorImagem").src = pathOk;
      document.getElementById("setorImagem").alt = "Imagem não disponível";
      document.getElementById("navButtons").style.display = "none";
      document.getElementById("legendaImagem").textContent =
        "Nenhuma imagem encontrada";
    } else {
      const hoje = new Date();
      const anoAtualAA = hoje.getFullYear() % 100; // 2026 -> 26
      const semanaHoje = getWeekNumber(hoje);
      buscarMaisRecente(anoAtualAA, semanaHoje, token, 0);
    }
  });
}

// busca a imagem AA-wXX.ext mais recente, andando em semanas/anos
function buscarMaisRecente(anoAA, semana, token, passos) {
  if (passos > ANOS_PARA_TRAS * SEMANA_MAX) {
    // limite de busca, não achou nada
    if (token !== ultimoToken) return;
    document.getElementById("setorImagem").src = "";
    document.getElementById("setorImagem").alt = "Imagem não disponível";
    document.getElementById("navButtons").style.display = "none";
    document.getElementById("legendaImagem").textContent =
      "Nenhuma imagem encontrada";
    return;
  }

  if (semana < SEMANA_MIN) {
    anoAA = anoAA - 1;
    semana = SEMANA_MAX;
  }
  if (anoAA < 0) {
    if (token !== ultimoToken) return;
    document.getElementById("setorImagem").src = "";
    document.getElementById("setorImagem").alt = "Imagem não disponível";
    document.getElementById("navButtons").style.display = "none";
    document.getElementById("legendaImagem").textContent =
      "Nenhuma imagem encontrada";
    return;
  }

  const pasta = `pontos/${setorAtual.id}${pontoAtual}`;
  const semanaStr = semana.toString().padStart(2, "0");
  const anoStr = anoAA.toString().padStart(2, "0");
  const basePath = `${pasta}/${anoStr}-w${semanaStr}`;

  tentarComExtensoes(basePath, (pathOk) => {
    if (token !== ultimoToken) return;

    if (pathOk) {
      imagemAtualAno = anoAA;
      imagemAtualSemana = semana;
      exibirImagemAtual(pathOk);
      document.getElementById("navButtons").style.display = "flex";
      preCarregarVizinhanca(anoAA, semana);
    } else {
      buscarMaisRecente(anoAA, semana - 1, token, passos + 1);
    }
  });
}

// ---------- NAVEGAÇÃO ----------

function navegarImagem(direcao) {
  if (imagemAtualAno === null || imagemAtualSemana === null) return;
  if (direcao === 0) return;

  ultimoToken++;
  navegarPara( imagemAtualAno, imagemAtualSemana + direcao, direcao, ultimoToken, 0 );
}

function navegarPara(anoAA, semana, direcao, token, passos) {
  if (passos > ANOS_PARA_TRAS * SEMANA_MAX) return;

  if (semana > SEMANA_MAX && direcao > 0) {
    anoAA = anoAA + 1;
    semana = SEMANA_MIN;
  }
  if (semana < SEMANA_MIN && direcao < 0) {
    anoAA = anoAA - 1;
    semana = SEMANA_MAX;
  }
  if (anoAA < 0) return;

  const pasta = `pontos/${setorAtual.id}${pontoAtual}`;
  const semanaStr = semana.toString().padStart(2, "0");
  const anoStr = anoAA.toString().padStart(2, "0");
  const basePath = `${pasta}/${anoStr}-w${semanaStr}`;

  tentarComExtensoes(basePath, (pathOk) => {
    if (token !== ultimoToken) return;

    if (pathOk) {
      imagemAtualAno = anoAA;
      imagemAtualSemana = semana;
      exibirImagemAtual(pathOk);
      preCarregarVizinhanca(anoAA, semana);
    } else {
      navegarPara(anoAA, semana + direcao, direcao, token, passos + 1);
    }
  });
}

// ---------- UTILITÁRIOS DE IMAGEM ----------

// tenta basePath com .jpg/.jpeg/.png
function tentarComExtensoes(basePath, callback) {
  let i = 0;

  function tentar() {
    if (i >= EXTENSOES.length) {
      callback(null);
      return;
    }
    const ext = EXTENSOES[i];
    const path = `${basePath}.${ext}`;

    testarImagem(path, (ok) => {
      if (ok) callback(path);
      else {
        i++;
        tentar();
      }
    });
  }

  tentar();
}

// testa uma URL de imagem com cache
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

// mostra imagem e legenda
function exibirImagemAtual(path) {
  const semanaStr = imagemAtualSemana.toString().padStart(2, "0");
  const anoStr = imagemAtualAno.toString().padStart(2, "0");

  document.getElementById("setorImagem").src = path;
  document.getElementById("setorImagem").alt =
    `Ponto ${pontoAtual} - ${setorAtual.nome} - ${anoStr}-w${semanaStr}`;
  document.getElementById("legendaImagem").textContent =
    `${setorAtual.nome.toUpperCase()} - PONTO ${pontoAtual} - SEMANA ${semanaStr} / ANO ${anoStr}`;
}

// pré-carrega semanas vizinhas (±2) no mesmo ano
function preCarregarVizinhanca(anoAA, semanaBase) {
  const pasta = `pontos/${setorAtual.id}${pontoAtual}`;
  const alvos = [semanaBase - 2, semanaBase - 1, semanaBase + 1, semanaBase + 2];

  alvos.forEach((sem) => {
    if (sem < SEMANA_MIN || sem > SEMANA_MAX) return;
    const sStr = sem.toString().padStart(2, "0");
    const aStr = anoAA.toString().padStart(2, "0");
    EXTENSOES.forEach((ext) => {
      const path = `${pasta}/${aStr}-w${sStr}.${ext}`;
      if (cacheImagens.has(path)) return;
      const img = new Image();
      img.onload = () => cacheImagens.set(path, true);
      img.onerror = () => cacheImagens.set(path, false);
      img.src = path;
    });
  });
}

// ---------- SEMANA DO ANO / LOGIN AUTO ----------

function getWeekNumber(date) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

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
