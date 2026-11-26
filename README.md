# Dono da Cidade

Jogo de estratégia de território no navegador. Escolha um lado (Facção, Milícia, Polícia ou Máfia), escolha sua base num mapa real e domine a cidade território por território.

Obra de ficção. Grupos e personagens são inventados.

## Estrutura

```
public/            site publicado (tudo que vai para o ar)
  index.html       o jogo inteiro (HTML, CSS e JS)
  maps/rio.json    167 bairros do Rio de Janeiro
  maps/palermo.json 81 municípios da província de Palermo
  _headers         cache dos mapas
tools/build_maps.py  script que gera os mapas a partir das fontes oficiais
wrangler.jsonc     configuração para publicar na Cloudflare
```

## Publicar na Cloudflare

Cada push na branch `main` publica sozinho depois que o projeto estiver conectado.

1. Cloudflare > Workers & Pages > Create > Import a repository.
2. Escolha `vinikunze/jogo1`.
3. Deixe o nome `jogo1`, comando de build vazio e comando de deploy `npx wrangler deploy`.
4. Salve. O jogo fica em `https://jogo1.<sua-conta>.workers.dev`. Domínio próprio em Settings > Domains & Routes.

## Rodar no seu computador

```
npx wrangler dev
```

Ou qualquer servidor estático apontando para `public/` (abrir o `index.html` direto do disco não funciona, porque os mapas são carregados com fetch).

## Fontes dos mapas

- Bairros do Rio: Instituto Pereira Passos, Prefeitura do Rio de Janeiro (Limite de Bairros), via o projeto bairros-rj.
- Municípios do Grande Rio: IBGE.
- Sicília: ISTAT, licença CC-BY, via openpolis/geojson-italy.
