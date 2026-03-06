import os
import re
import shutil
from datetime import datetime

# =============================
# Configurações e caminhos
# =============================
DIR_SCRIPT = os.path.dirname(os.path.abspath(__file__))
DIR_SEPARAR = os.path.join(DIR_SCRIPT, 'Separar Fotos')

EXTS = ('.jpg', '.jpeg', '.png', '.bmp', '.webp', '.gif', '.tif', '.tiff')

# _YYYYMMDD_HHMMSS para extrair data
PATT_DATETIME = re.compile(r'_(\d{8})(?:_(\d{6}))?')

# Aceitar "VSR" com espaço/hífens ao redor e separador espaço/hífen antes do PXX
# Exemplos aceitos:
# ...-VSR-SETOR-A-P01_20250808_154021
# ... VSR SETOR A P01_20250808_154021
# ... VSR-SETOR A - P12_20250101_101010
SEP = r'[\s-]+'  # um ou mais espaços e/ou hífens
PATT_VSR_NOME_P = re.compile(
    rf'VSR{SEP}([A-Za-z0-9\s-]+?){SEP}P(\d{{2,}})_(\d{{8}})(?:_(\d{{6}}))?',
    re.IGNORECASE
)

# =============================
# Utilitários
# =============================
def extrair_pasta_data(nome_arquivo: str) -> str:
    m = PATT_DATETIME.search(nome_arquivo)
    if not m:
        print(f'[AVISO] Nome sem padrão de data (_YYYYMMDD): {nome_arquivo}')
        return '00.00'
    yyyymmdd = m.group(1)
    return f'{yyyymmdd[4:6]}.{yyyymmdd[6:8]}'

def eh_vsr(nome_arquivo: str) -> bool:
    # Basta conter "VSR" em qualquer lugar do nome
    return 'VSR' in nome_arquivo.upper()

def parse_vsr_nome_e_numero(nome_arquivo: str):
    m = PATT_VSR_NOME_P.search(nome_arquivo)
    if not m:
        return None, None, None
    # Remove espaços e hífens, e coloca tudo minúsculo
    nome_limpo = re.sub(r'[\s-]+', '', m.group(1)).lower()
    numero = int(m.group(2))
    yyyymmdd = m.group(3)
    return nome_limpo, numero, yyyymmdd

def garantir_diretorio(caminho: str) -> None:
    os.makedirs(caminho, exist_ok=True)

def calcular_semana_iso(yyyymmdd: str) -> int:
    dt = datetime.strptime(yyyymmdd, '%Y%m%d').date()
    return dt.isocalendar()[1]

def caminho_sem_sobrepor(dest_dir: str, nome_arquivo: str) -> str:
    destino = os.path.join(dest_dir, nome_arquivo)
    i = 1
    base, ext = os.path.splitext(nome_arquivo)
    while os.path.exists(destino):
        destino = os.path.join(dest_dir, f'{base}_{i}{ext}')
        i += 1
    return destino

# =============================
# Principal
# =============================
def main():
    print('== Organizador de Fotos (renomeando VSR para wXX) ==')
    if not os.path.isdir(DIR_SEPARAR):
        raise FileNotFoundError(f'Pasta "Separar Fotos" não encontrada: {DIR_SEPARAR}')

    cont_move_vsr = 0
    cont_move_outros = 0
    cont_vsr_fora_do_padrao = 0
    por_data = {}

    for entry in os.scandir(DIR_SEPARAR):
        if not entry.is_file():
            continue
        nome = entry.name
        if not nome.lower().endswith(EXTS):
            continue

        data_folder = extrair_pasta_data(nome)

        if eh_vsr(nome):
            nome_setor, numero, yyyymmdd = parse_vsr_nome_e_numero(nome)
            if not nome_setor or not numero or not yyyymmdd:
                print(f'[AVISO] VSR fora do padrão esperado: {nome}')
                dir_vsr_base = os.path.join(DIR_SEPARAR, data_folder, 'VSR', '_indefinido')
                garantir_diretorio(dir_vsr_base)
                destino_final = caminho_sem_sobrepor(dir_vsr_base, nome)
                shutil.move(entry.path, destino_final)
                cont_vsr_fora_do_padrao += 1
                por_data.setdefault(data_folder, {'VSR': 0, 'OUTROS': 0})
                por_data[data_folder]['VSR'] += 1
                continue

            # Calcula semana e define nome final como wXX.jpg
            semana = calcular_semana_iso(yyyymmdd)
            novo_nome = f"w{semana:02}.jpg"

            destino_dir = os.path.join(DIR_SEPARAR, data_folder, 'VSR', f'{nome_setor}{numero}')
            garantir_diretorio(destino_dir)
            destino_final = caminho_sem_sobrepor(destino_dir, novo_nome)
            shutil.move(entry.path, destino_final)
            cont_move_vsr += 1
            por_data.setdefault(data_folder, {'VSR': 0, 'OUTROS': 0})
            por_data[data_folder]['VSR'] += 1
            print(f'[OK] VSR -> {data_folder}/VSR/{nome_setor}{numero}/{os.path.basename(destino_final)}')
        else:
            destino_dir = os.path.join(DIR_SEPARAR, data_folder)
            garantir_diretorio(destino_dir)
            destino_final = caminho_sem_sobrepor(destino_dir, nome)
            shutil.move(entry.path, destino_final)
            cont_move_outros += 1
            por_data.setdefault(data_folder, {'VSR': 0, 'OUTROS': 0})
            por_data[data_folder]['OUTROS'] += 1
            print(f'[OK] OUT -> {data_folder}/{os.path.basename(destino_final)}')

    # Resumo
    print('----------------------------------------')
    for data_folder, d in sorted(por_data.items()):
        print(f'  {data_folder}: VSR={d["VSR"]} | OUTROS={d["OUTROS"]}')
    print(f'Total movidos VSR:           {cont_move_vsr}')
    print(f'Total movidos OUTROS:        {cont_move_outros}')
    print(f'VSR fora do padrão esperado: {cont_vsr_fora_do_padrao}')
    print('Concluído.')

if __name__ == '__main__':
    main()
