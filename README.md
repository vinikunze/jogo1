# Dono da Cidade

Jogo de estratégia de território no navegador. Escolha um lado (Facção, Milícia, Polícia ou Máfia), comece do zero ou já no comando, suba de cargo pelas missões do celular e domine a cidade zona por zona.

Obra de ficção. Grupos e personagens são inventados.

## Estrutura

```
public/              site publicado (tudo que vai para o ar)
  index.html         estrutura da página
  css/app.css        visual (HUD, painel, celular estilo WhatsApp)
  js/data.js         modos, cargos, habilidades, construções, mercadorias, conquistas
  js/engine.js       regras: combate, economia, carreira, mensagens, IA, eventos
  js/map.js          mapa MapLibre com ruas do OpenFreeMap e as zonas por cima
  js/ui.js           menu, HUD, painel, celular, diálogos e som
  maps/rio.json      32 zonas fictícias sobre o Rio de Janeiro
  maps/palermo.json  22 zonas fictícias sobre a província de Palermo
  vendor/            MapLibre GL JS
  _headers           regras de cache
tools/build_zones.py  gera as zonas (agrupa bairros/municípios reais e dissolve os contornos)
tools/build_maps.py   funções de geometria usadas pelo build_zones
wrangler.jsonc       configuração para publicar na Cloudflare
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
