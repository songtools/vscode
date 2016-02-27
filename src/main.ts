'use strict';
import * as vscode from 'vscode';
import { CHORDSOVERLYRICS_MODE } from './mode';
import { SongToolsDocumentFormattingEditProvider, Formatter } from './format';
import { SongToolsPreviewContentProvider } from './preview';

export function activate(context: vscode.ExtensionContext) {

    registerFormatting(context);
    registerPreviewing(context);


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

function registerFormatting(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(CHORDSOVERLYRICS_MODE, new SongToolsDocumentFormattingEditProvider()));

    vscode.commands.registerCommand('songtools.format', () => {
        if (vscode.window.activeTextEditor == null) {
            return;
        }

        vscode.window.showQuickPick([CHORDSOVERLYRICS_MODE.language]).then(pick => {
            return new Formatter().formatDocument(pick, vscode.window.activeTextEditor.document);
        }).then(edits => {
            return vscode.window.activeTextEditor.edit(builder => {
                edits.forEach(edit => builder.replace(edit.range, edit.newText));
            });
        }, error => {
            vscode.window.showErrorMessage("Unable to format song: " + error);
        });
    });
}

function registerPreviewing(context: vscode.ExtensionContext) {
    let previewUri = vscode.Uri.parse('songtools-preview://authority/songtools-preview')
    let songToolsPreviewProvider = new SongToolsPreviewContentProvider();
    context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(previewUri.scheme, songToolsPreviewProvider));

    let previewDocument = function(document: vscode.TextDocument) {
        if (document === vscode.window.activeTextEditor.document) {
            songToolsPreviewProvider.update(previewUri);
        }
    }
    
    vscode.workspace.onDidChangeTextDocument((e: vscode.TextDocumentChangeEvent) => {
        previewDocument(e.document);
    });
    vscode.window.onDidChangeActiveTextEditor((e: vscode.TextEditor) => {
        previewDocument(e.document);
    });
    
    vscode.commands.registerCommand('songtools.showPreview', () => {
        return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.Two).then((success) => {
        }, (error) => {
            vscode.window.showErrorMessage(error);
        });
    });
}