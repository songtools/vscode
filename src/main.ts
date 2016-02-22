'use strict';
import * as vscode from 'vscode';
import { CHORDSOVERLYRICS_MODE } from './mode';
import { SongToolsDocumentFormattingEditProvider, Formatter } from './format';

export function activate(context: vscode.ExtensionContext) {
    
    context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(CHORDSOVERLYRICS_MODE, new SongToolsDocumentFormattingEditProvider()));
    startBuildOnSaveWatcher(context.subscriptions);
    
    vscode.commands.registerCommand('songtools.formatChordsOverLyrics', () => {
		vscode.window.showInformationMessage('Formatting as ChordsOverLyrics!');
	});

	vscode.commands.registerCommand('songtools.transpose', () => {
		vscode.window.showInformationMessage('Tranposing!');
	});
    
    vscode.languages.setLanguageConfiguration(CHORDSOVERLYRICS_MODE.language, {
        comments: {
            lineComment: '//',
            blockComment: ['{comment:', '}']
        },
        brackets: [
            ['{', '}'],
            ['[', ']']
        ]
    });
}

// this method is called when your extension is deactivated
export function deactivate() {
}

function startBuildOnSaveWatcher(subscriptions: vscode.Disposable[]) {

	// TODO: This is really ugly.  I'm not sure we can do better until
	// Code supports a pre-save event where we can do the formatting before
	// the file is written to disk.	
	let ignoreNextSave = new WeakSet<vscode.TextDocument>();

	vscode.workspace.onDidSaveTextDocument(document => {
		if (document.languageId !== 'chordsOverLyrics' || ignoreNextSave.has(document)) {
			return;
		}
		let config = vscode.workspace.getConfiguration('songtools');
		let textEditor = vscode.window.activeTextEditor;
		let formatPromise: PromiseLike<void> = Promise.resolve();
		if (config['formatOnSave'] && textEditor.document === document) {
			let formatter = new Formatter(document.languageId);
			formatPromise = formatter.formatDocument(document).then(edits => {
				return textEditor.edit(editBuilder => {
					edits.forEach(edit => editBuilder.replace(edit.range, edit.newText));
				});
			}).then(applied => {
				ignoreNextSave.add(document);
				return document.save();
			}).then(() => {
				ignoreNextSave.delete(document);
			}, () => {
				// Catch any errors and ignore so that we still trigger 
				// the file save.
			});
		}
	}, null, subscriptions);
}