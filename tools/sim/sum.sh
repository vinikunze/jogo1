#!/bin/bash
# resumo: vitórias, dia médio das vitórias, zonas médias no fim
N=${1:-5}; D=${2:-100}
for m in faccao milicia policia mafia cartel; do
  for i in $(seq 1 $N); do timeout 120 node $(dirname $0)/sim.mjs $m 2 $D 1 2>&1 | tail -1; done | awk -v m=$m '{w+=($4=="win");l+=($4=="lose"); if($4=="win"){sd+=$6} z+=$8+0} END{printf "%-8s win %d lose %d none %d  dia-vit %s  zonas-fim %.0f\n", m, w, l, NR-w-l, (w?int(sd/w):"-"), z/NR}'
done
