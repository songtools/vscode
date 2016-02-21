'use strict';
import * as vscode from 'vscode';
import { CHORDSOVERLYRICS_MODE } from './mode';
import { SongToolsDocumentFormattingEditProvider, Formatter } from './format';

export function activate(context: vscode.ExtensionContext) {
    
    context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(CHORDSOVERLYRICS_MODE, new SongToolsDocumentFormattingEditProvider()));
    
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