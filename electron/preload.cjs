const electronRenderer = require('electron');

globalThis.__ELECTRON_RENDERER__ = electronRenderer;

import('./preload.js');
