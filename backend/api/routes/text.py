"""
api/routes/text.py — POST /parse/text

Recebe texto livre descrevendo uma refeição e retorna
a análise nutricional com itens identificados.

Fluxo interno:
1. Tenta resolver cada alimento via dataset local (Camada 0)
2. Para itens não resolvidos, determina complexidade
3. Encaminha para LLM barato (Camada 1) ou médio (Camada 2)
4. Consolida resultados e retorna ParseResponse
"""

from fastapi import APIRouter

from models.schemas import TextParseRequest, ParseResponse

router = APIRouter()


@router.post("/text", response_model=ParseResponse)
async def parse_text(request: TextParseRequest) -> ParseResponse:
    """
    Analisa texto livre e retorna estimativa nutricional.

    Args:
        request: TextParseRequest com texto e idioma.

    Returns:
        ParseResponse com itens, totais e notas de incerteza.

    Raises:
        NotImplementedError: stub — lógica ainda não implementada.
    """
    # TODO: implement
    # 1. Tokenizar texto em itens individuais
    # 2. Para cada item: tentar dataset_lookup (pipeline.nutrition.dataset_lookup)
    # 3. Itens não resolvidos → pipeline.text.router.route(text, unresolved)
    # 4. Montar ParseResponse consolidada
    raise NotImplementedError("TODO: implement parse_text route")
