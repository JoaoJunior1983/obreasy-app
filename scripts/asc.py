"""Cliente mínimo da App Store Connect API.

Gera um JWT novo a cada execução (o token da Apple vale 20 minutos) e expõe
`api()` para chamadas REST e `upload()` para o fluxo de três passos dos assets.

Uso:
    from scripts.asc import api, APP_ID
    st, dados = api("GET", f"apps/{APP_ID}/appStoreVersions")
"""
import json
import pathlib
import re
import time
import urllib.error
import urllib.request

import jwt

_RAIZ = pathlib.Path(__file__).resolve().parent.parent
_ENV = (_RAIZ / ".env").read_text()


def _var(nome: str) -> str:
    achado = re.search(rf"^{nome}=(.+)$", _ENV, re.M)
    if not achado:
        raise RuntimeError(f"{nome} não está no .env")
    return achado.group(1).strip()


APP_ID = _var("ASC_APP_ID")
BASE = "https://api.appstoreconnect.apple.com/v1"


def token() -> str:
    chave = (_RAIZ / _var("ASC_API_KEY_FILE")).read_text()
    agora = int(time.time())
    return jwt.encode(
        {"iss": _var("ASC_API_ISSUER_ID"), "iat": agora, "exp": agora + 1140, "aud": "appstoreconnect-v1"},
        chave,
        algorithm="ES256",
        headers={"kid": _var("ASC_API_KEY_ID"), "typ": "JWT"},
    )


def api(metodo: str, caminho: str, payload=None, tok=None):
    tok = tok or token()
    corpo = json.dumps(payload).encode() if payload else None
    req = urllib.request.Request(
        f"{BASE}/{caminho}",
        data=corpo,
        method=metodo,
        headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, (json.load(resp) if resp.status != 204 else {})
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()
