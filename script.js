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

let imagemAtualSemana = null;
let imagemAtualAno = null;
let setorAtual = null;
let pontoAtual = null;
let botaoSelecionado = null;
let ultimoToken = 0;

// limites de semana que você quer permitir (ajuste se quiser mais amplo)
const SEMANA_MIN = 1;
const SEMANA_MAX = 99;

// extensões aceitas
const EXTENSOES = ["jpg", "jpeg", "png"];

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
      imagemAtualSemana = null;
      imagemAtualAno = null;
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
  imagemAtualSemana = null;
  imagemAtualAno = null;

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
      document.querySelectorAll(".ponto").forEach((p) => p.classList.remove("ativo"));
      ponto.classList.add("ativo");
      abrirImagem(setor, i);
    };
    container.appendChild(ponto);
  }
}

function abrirImagem(setor, ponto) {
  setorAtual = setor;
  pontoAtual = ponto;
  imagemAtualSemana = null;
  imagemAtualAno = null;
  ultimoToken++;

  verificarEmptyOuBuscar(ultimoToken);
}

// tenta carregar o empty.* (se existir) senão busca imagem mais recente
function verificarEmptyOuBuscar(token) {
  const basePath = `pontos/${setorAtual.id}${pontoAtual}/empty`;
  tentarCarregarComExtensoes(basePath, (okPath) => {
    if (token !== ultimoToken) return;
    if (okPath) {
      document.getElementById("setorImagem").src = okPath;
      document.getElementById("setorImagem").alt = "Imagem não disponível";
      document.getElementById("navButtons").style.display = "none";
      document.getElementById("legendaImagem").textContent = "Nenhuma imagem encontrada";
    } else {
      // não tem empty, então vamos direto buscar a primeira imagem válida (mais recente)
      const hoje = new Date();
      const semanaAtual = getWeekNumber(hoje);
      const anoAtual = hoje.getFullYear() % 100; // pega AA (ex: 25)
      buscarImagemMaisRecente(anoAtual, semanaAtual, token);
    }
  });
}

// tenta carregar path com qualquer extensão válida
function tentarCarregarComExtensoes(basePathSemExt, callback) {
  let indice = 0;

  function tentarProxima() {
    if (indice >= EXTENSOES.length) {
      callback(null);
      return;
    }
    const ext = EXTENSOES[indice];
    const path = `${basePathSemExt}.${ext}`;
    const img = new Image();
    img.onload = () => callback(path);
    img.onerror = () => {
      indice++;
      tentarProxima();
    };
    img.src = path;
  }

  tentarProxima();
}

// busca a imagem mais recente (ano/semana mais alta) descendo semana e depois ano
function buscarImagemMaisRecente(ano, semana, token) {
  if (ano < 0) {
    // nenhum arquivo encontrado
    if (token !== ultimoToken) return;
    document.getElementById("setorImagem").src = "";
    document.getElementById("setorImagem").alt = "Imagem não disponível";
    document.getElementById("navButtons").style.display = "none";
    document.getElementById("legendaImagem").textContent = "Nenhuma imagem encontrada";
    return;
  }

  if (semana < SEMANA_MIN) {
    // volta um ano e começa do max de semana
    buscarImagemMaisRecente(ano - 1, SEMANA_MAX, token);
    return;
  }

  const rotuloSemana = semana.toString().padStart(2, "0"); // XX
  const rotuloAno = ano.toString().padStart(2, "0"); // AA
  const basePath = `pontos/${setorAtual.id}${pontoAtual}/${rotuloAno}-w${rotuloSemana}`;

  tentarCarregarComExtensoes(basePath, (okPath) => {
    if (token !== ultimoToken) return;
    if (okPath) {
      imagemAtualSemana = semana;
      imagemAtualAno = ano;
      exibirImagemAtual(okPath);
      document.getElementById("navButtons").style.display = "flex";
    } else {
      buscarImagemMaisRecente(ano, semana - 1, token);
    }
  });
}

function exibirImagemAtual(caminhoOpcional) {
  let path;
  if (caminhoOpcional) {
    path = caminhoOpcional;
  } else {
    const rotuloSemana = imagemAtualSemana.toString().padStart(2, "0");
    const rotuloAno = imagemAtualAno.toString().padStart(2, "0");
    const basePath = `pontos/${setorAtual.id}${pontoAtual}/${rotuloAno}-w${rotuloSemana}`;
    // aqui a gente assume que já existe, pois foi validado antes
    // mas para segurança podemos tentar novamente
    path = `${basePath}.jpg`;
  }

  const rotuloSemana = imagemAtualSemana.toString().padStart(2, "0");
  const rotuloAno = imagemAtualAno.toString().padStart(2, "0");

  document.getElementById("setorImagem").src = path;
  document.getElementById("setorImagem").alt =
    `Ponto ${pontoAtual} - ${setorAtual.nome} - ${rotuloAno}-w${rotuloSemana}`;
  document.getElementById("legendaImagem").textContent =
    `${setorAtual.nome.toUpperCase()} - PONTO ${pontoAtual} - SEMANA ${rotuloSemana} / ANO ${rotuloAno}`;
}

// direção -1 para voltar semana, +1 para avançar
function navegarImagem(direcao) {
  if (imagemAtualSemana === null || imagemAtualAno === null) return;
  ultimoToken++;

  if (direcao === 0) return;

  navegarParaSemana(imagemAtualAno, imagemAtualSemana + direcao, direcao, ultimoToken);
}

// tenta navegar semana a semana (e ano a ano, se passar do limite)
function navegarParaSemana(ano, semana, direcao, token) {
  if (direcao > 0 && semana > SEMANA_MAX) {
    // passa para próximo ano
    navegarParaSemana(ano + 1, SEMANA_MIN, direcao, token);
    return;
  }
  if (direcao < 0 && semana < SEMANA_MIN) {
    // volta um ano
    if (ano <= 0) return;
    navegarParaSemana(ano - 1, SEMANA_MAX, direcao, token);
    return;
  }

  const rotuloSemana = semana.toString().padStart(2, "0");
  const rotuloAno = ano.toString().padStart(2, "0");
  const basePath = `pontos/${setorAtual.id}${pontoAtual}/${rotuloAno}-w${rotuloSemana}`;

  tentarCarregarComExtensoes(basePath, (okPath) => {
    if (token !== ultimoToken) return;
    if (okPath) {
      imagemAtualSemana = semana;
      imagemAtualAno = ano;
      exibirImagemAtual(okPath);
    } else {
      // continua na mesma direção
      navegarParaSemana(ano, semana + direcao, direcao, token);
    }
  });
}

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
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
