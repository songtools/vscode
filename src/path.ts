'use strict';

import fs = require('fs');
import path = require('path');

let binPathCache: { [bin: string]: string; } = {};

export function getBinPath(binname: string) {
    binname = correctBinname(binname);
    
    if (binPathCache[binname]) {
        return binPathCache[binname];
    }
    
	if (process.env['PATH']) {
		let pathparts = process.env['PATH'].split(path.delimiter);
		for (let i = 0; i < pathparts.length; i++) {
			let binpath = path.join(pathparts[i], binname);
			if (fs.existsSync(binpath)) {
				binPathCache[binname] = binpath;
				return binpath;
			}
		}
	}
}

function correctBinname(binname: string) {
    if (process.platform === 'win32') {
        return binname + '.exe';
    }
    
    return binname;
}
