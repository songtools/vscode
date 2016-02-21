'use strict';

import vscode = require('vscode');
import cp = require('child_process');
import path = require('path');
import dmp = require('diff-match-patch');
import { getBinPath } from './path';

let EDIT_DELETE = 0;
let EDIT_INSERT = 1;
let EDIT_REPLACE = 2;
class Edit {
	action: number;
	start: vscode.Position;
	end: vscode.Position;
	text: string;

	constructor(action: number, start: vscode.Position) {
		this.action = action;
		this.start = start;
		this.text = '';
	}

	apply(): vscode.TextEdit {
		switch (this.action) {
			case EDIT_INSERT:
				return vscode.TextEdit.insert(this.start, this.text);
			case EDIT_DELETE:
				return vscode.TextEdit.delete(new vscode.Range(this.start, this.end));
			case EDIT_REPLACE:
				return vscode.TextEdit.replace(new vscode.Range(this.start, this.end), this.text);
		}
	}
}

export class Formatter {
    private formatCommand = "songfmt";
    private format = "chordsOverLyrics";

    constructor(format: string) {
        this.format = format;
    }
    
    public formatDocument(document: vscode.TextDocument): Thenable<vscode.TextEdit[]> {
        return new Promise((resolve, reject) => {
            let filename = document.fileName;
            let formatCommandBinPath = getBinPath(this.formatCommand);
            
            cp.execFile(formatCommandBinPath, [filename], {}, (err, stdout, stderr) => {
                try {
                    if (err && (<any>err).code === 'ENOENT') {
                        vscode.window.showInformationMessage('The "' + formatCommandBinPath + '" command is not available.');
                        return resolve(null);
                    }
                    if (err) {
                        return reject('Cannot format due to syntax errors.');
                    }
                    
                    let text = stdout.toString();
                    let d = new dmp.diff_match_patch();
                    
                    let diffs = d.diff_main(document.getText(), text);
                    let line = 0;
                    let character = 0;
                    let edits: vscode.TextEdit[] = [];
                    let edit: Edit = null;
                    
                    for (let i = 0; i < diffs.length; i++) {
                        let start = new vscode.Position(line, character);
                        
                        for (let curr = 0; curr < diffs[i][1].length; curr++) {
                            if (diffs[i][1][curr] !== '\n') {
                                character++;
                            } else {
                                character = 0;
                                line++;
                            }
                        }
                        
                        switch (diffs[i][0]) {
                            case dmp.DIFF_DELETE:
                                if (edit == null) {
                                    edit = new Edit(EDIT_DELETE, start);
                                } else if (edit.action !== EDIT_DELETE) {
                                    return reject('cannot format due to an internal error.');
                                }
                                
                                edit.end = new vscode.Position(line, character);
                                break;
                            case dmp.DIFF_INSERT:
                                if (edit == null) {
                                    edit = new Edit(EDIT_INSERT, start);
                                } else if (edit.action === EDIT_DELETE) {
                                    edit.action = EDIT_REPLACE;
                                }
                                
                                line = start.line;
                                character = start.character;
                                edit.text += diffs[i][1];
                                break;
                            case dmp.DIFF_EQUAL:
                                if (edit != null) {
                                    edits.push(edit.apply());
                                    edit = null;
                                }
                                break;
                        }
                    }
                    
                    if (edit != null) {
                        edits.push(edit.apply());
                    }
                    
                    return resolve(edits);
                    
                } catch (e) {
                    reject(e);
                }
            });
        });
    }
}

export class SongToolsDocumentFormattingEditProvider implements vscode.DocumentFormattingEditProvider {
    private formatter: Formatter;
    
    constructor() {
        this.formatter = new Formatter("chordsOverLyrics");
    }
    
    public provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): Thenable<vscode.TextEdit[]> {
        return document.save().then(() => {
            return this.formatter.formatDocument(document);
        })
    }
}