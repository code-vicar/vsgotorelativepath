var vscode = require('vscode');
var path = require('path');
var fs = require('fs');

function activate(context) {
    /*
        This command will take the current current line that the cursor
        is on, tokenize it into strings delimited by single or double quote characters
        and then check if the cursor position is within one of those strings

        If the cursor is inside of a string, the contents of the string are inspected
        to see if they look like a relative path.  If it looks like a relative path
        then the command will attempt to resolve the file at that relative path 
        using the active editor location as the source
    */
    var disposable = vscode.commands.registerTextEditorCommand('extension.goToRelativePath', function (editor) {
        if (!editor) {
            return; // No open text editor
        }
        let sourceUri = editor.document.uri
        if (sourceUri.scheme !== 'file') { return }

        let activePos = editor.selection.active
        let colNo = activePos.character
        
        let activeLine = editor.document.lineAt(activePos)
        let activeLineText = activeLine.text

        let strCharReg = /([\'\"])/
        let strings = []

        let split = activeLineText.split(strCharReg)

        let idx = 0
        let _idx = 0
        let context = '';
        let currStr = '';
        for (let token of split) {
            _idx = idx
            idx += token.length
            if (strCharReg.test(token)) {
                if (context === '') {
                    context = token
                    continue
                }

                if (token === context) {
                    context = ''
                    strings.push({
                        endIdx: _idx,
                        startIdx: _idx - currStr.length,
                        str: currStr
                    })
                    currStr = ''
                    continue
                }
            }

            if (context !== '') {
                currStr += token
            }
        }

        let relPath
        for (let str of strings) {
            if (colNo >= str.startIdx && colNo <= str.endIdx) {
                relPath = str.str
                break
            }
        }

        if (!relPath) {
            return
        }

        if (!relPath.startsWith('.')) {
            return
        }

        let fromDir = path.dirname(sourceUri.fsPath)
        let toPath = path.resolve(fromDir, relPath)
        let toPathStat

        try {
            toPathStat = fs.statSync(toPath)
        } catch(e) {
            toPathStat = null
        }

        if (toPathStat) {
            if (toPathStat.isFile()) {
                vscode.workspace.openTextDocument(toPath)
            } else if (toPathStat.isDirectory()) {
                openDirectory(toPath)
            }
        } else {
            // the path wasn't a valid path
            // try the parent directory
            let basename = path.basename(toPath)
            let toPathParent =  path.dirname(toPath)

            let toPathParentStat
            try {
                toPathParentStat = fs.statSync(toPathParent)
            } catch(e) {
                toPathParentStat = null
            }

            if (!toPathParentStat) {
                // well, we tried
                return
            }
            
            if (toPathParentStat.isDirectory()) {
                openDirectory(toPathParent, basename)
            }
        }
    });

    context.subscriptions.push(disposable);
}
exports.activate = activate;

function openDirectory(dir, basename = 'index') {
    let dirContents = fs.readdirSync(dir)
    let match = dirContents.find((item) => {
        return item.startsWith(basename)
    })
    if (!match) {
        return
    }
    let matchFullPath = path.join(dir, match)
    vscode.workspace.openTextDocument(matchFullPath).then((doc) => {
        vscode.window.showTextDocument(doc)
    })
}

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;