'use strict';
import * as vscode from 'vscode';
import { CHORDSOVERLYRICS_MODE } from './mode';
import { getBinPath } from './path';
import { SongToolsDocumentFormattingEditProvider, Formatter } from './format';
import cp = require('child_process');

class Previewer {
    private previewCommand = "songfmt";
    
    public previewDocument(document: vscode.TextDocument): Thenable<string> {
        return new Promise((resolve, reject) => {
            let formatCommandBinPath = getBinPath(this.previewCommand);
                        
            let program = cp.execFile(formatCommandBinPath, ["--infmt", document.languageId, "--outfmt", "html"], (err, stdout, stderr) => {
                try {
                    if (err && (<any>err).code === 'ENOENT') {
                        vscode.window.showInformationMessage('The "' + formatCommandBinPath + '" command is not available.');
                        return resolve(null);
                    }
                    if (err) {
                        return reject('Cannot format due to syntax errors.');
                    }
                    
                    let errorString = stderr.toString();
                    if(errorString !== "") {
                        return reject(errorString);
                    }
                    
                    let text = stdout.toString();
                    return resolve(text);
                    
                } catch (e) {
                    reject(e);
                }
            });
            program.stdin.end(document.getText());
        });
    }
}

export class SongToolsPreviewContentProvider implements vscode.TextDocumentContentProvider {
    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
    private previewer = new Previewer()
    
    public provideTextDocumentContent(uri: vscode.Uri): Thenable<string> {
        return this.createHtml();
    }
    
    get onDidChange(): vscode.Event<vscode.Uri> {
        return this._onDidChange.event;
    }
    
    public update(uri: vscode.Uri) {
        this._onDidChange.fire(uri);
    }
    
    private createHtml(): Thenable<string> {
        let editor = vscode.window.activeTextEditor;
        if (editor == null) {
            return this.errorHtml("No active editor.");
        }
        if (!(editor.document.languageId === CHORDSOVERLYRICS_MODE.language)) {
            return this.errorHtml("Active editor doesn't show a document that can render a song.");
        }

        return this.previewer.previewDocument(editor.document);
    }
    
    private errorHtml(error: string): Thenable<string> {
        return new Promise<string>((resolve, reject) => 
        {
            resolve(
                `<body>
                    ${error}
                </body>`);
        });
    }
    
}