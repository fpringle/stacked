#!/bin/bash

mkdir -p src/build

echo '(function() {' > src/build/stacked.js

cat src/language.js src/editor.js src/map.js src/player.js src/levels.js src/game.js src/index.js >> src/build/stacked.js

echo '})();' >> src/build/stacked.js
