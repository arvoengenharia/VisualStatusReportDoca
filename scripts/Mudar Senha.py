import hashlib
import re
import os

def gerar_sha256(texto):
    texto = texto.strip()
    return hashlib.sha256(texto.encode()).hexdigest()

def atualizar_script_js(hash_novo):
    # Pega o diretório onde este script.py está
    pasta_atual = os.path.dirname(os.path.abspath(__file__))

    # Vai para a pasta pai (raiz do projeto)
    raiz_projeto = os.path.dirname(pasta_atual)

    # Caminho absoluto até o script.js na raiz
    caminho_script = os.path.join(raiz_projeto, 'script.js')

    if not os.path.exists(caminho_script):
        print(f"❌ Arquivo 'script.js' não encontrado no caminho: {caminho_script}")
        input("Pressione ENTER para sair...")
        return

    with open(caminho_script, 'r', encoding='utf-8') as f:
        conteudo = f.read()

    novo_conteudo, alterado = re.subn(
        r'const senhaHash\s*=\s*".*?";',
        f'const senhaHash = "{hash_novo}";',
        conteudo
    )

    if alterado:
        with open(caminho_script, 'w', encoding='utf-8') as f:
            f.write(novo_conteudo)
        print(f"\n✅ Hash atualizada com sucesso em:\n{caminho_script}")
    else:
        print("\n⚠️ Linha 'const senhaHash = ...' não encontrada. Nenhuma modificação foi feita.")

if __name__ == "__main__":
    senha = input("Digite a nova senha: ")
    hash_gerado = gerar_sha256(senha)
    print(f"\nHash SHA256 gerada:\n{hash_gerado}\n")
    atualizar_script_js(hash_gerado)
    input("\nPressione ENTER para sair...")  # <- Adicionada aqui
