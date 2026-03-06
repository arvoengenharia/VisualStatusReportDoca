import os
import json
import shutil

# Caminho da pasta onde este script está
DIR_SCRIPT = os.path.dirname(os.path.abspath(__file__))

# Caminho da raiz do projeto (um nível acima)
RAIZ = os.path.dirname(DIR_SCRIPT)

# Caminhos ajustados para trabalhar como se estivesse na raiz
PASTA_SETORES = os.path.join(RAIZ, 'setores')
PASTA_PONTOS = os.path.join(RAIZ, 'pontos')
CAMINHO_JSON = os.path.join(PASTA_SETORES, 'setores.json')
CAMINHO_HTML = os.path.join(RAIZ, 'index.html')
CAMINHO_EMPTY = os.path.join(PASTA_PONTOS, 'empty.jpg')

setores = {}

# Etapa 1 – Ler arquivos da pasta setores
for nome_arquivo in os.listdir(PASTA_SETORES):
    if nome_arquivo.lower().endswith('.png'):
        nome_setor = nome_arquivo[:-4].strip()
        while True:
            entrada = input(f"Quantos pontos o setor '{nome_setor}' tem? ")
            try:
                qtd = int(entrada)
                setores[nome_setor] = qtd
                break
            except ValueError:
                print("Número inválido. Tente novamente.")

# Etapa 2 – Salvar setores.json
with open(CAMINHO_JSON, 'w', encoding='utf-8') as f:
    json.dump(setores, f, indent=2, ensure_ascii=False)
print(f"\n✅ JSON salvo em: {CAMINHO_JSON}")

# Etapa 3 – Criar pastas em /pontos e copiar empty.jpg
for setor, qtd in setores.items():
    id_setor = setor.lower().replace(' ', '')
    for i in range(1, qtd + 1):
        pasta = os.path.join(PASTA_PONTOS, f"{id_setor}{i}")
        os.makedirs(pasta, exist_ok=True)
        destino = os.path.join(pasta, 'empty.jpg')
        shutil.copyfile(CAMINHO_EMPTY, destino)

print("✅ Pastas e empty.jpg geradas com sucesso.")

# Etapa 4 – Substituir conteúdo do JSON embutido no index.html
with open(CAMINHO_HTML, 'r', encoding='utf-8') as f:
    html = f.read()

inicio_tag = html.find('<script id="setores-json" type="application/json">')
fim_tag = html.find('</script>', inicio_tag)

if inicio_tag == -1 or fim_tag == -1:
    print("❌ Tag <script id='setores-json'> não encontrada no HTML.")
else:
    json_formatado = json.dumps(setores, indent=2, ensure_ascii=False)
    trecho_novo = f'<script id="setores-json" type="application/json">\n{json_formatado}\n</script>'
    html_novo = html[:inicio_tag] + trecho_novo + html[fim_tag+9:]  # 9 = len('</script>')

    with open(CAMINHO_HTML, 'w', encoding='utf-8') as f:
        f.write(html_novo)

    print("✅ index.html atualizado com os dados dos setores.")
