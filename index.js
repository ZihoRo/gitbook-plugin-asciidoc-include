var path = require('path');
var fs = require('fs');
var Q = require('q');

module.exports = {
    hooks: {
        "page:before": function(page) {
            if(!page || page.type !== 'asciidoc'){
                return page;
            }
            var handlerNext = function(context) {
                context.matchs = context.regex.exec(context.page.content);
                if(!context.matchs){
                    // remove page.content first and last \n
                    context.page.content = context.page.content.substring(1, context.page.content.length - 1);
                    return context.page;
                }
                // trim the match string
                context.match = context.matchs[0].trim();
                // find block and replace
                context.file = context.blockHandler(context.matchs[1]);
                context.logger.info.ln('file: ' + context.file + ', matchs[1]: ' + context.matchs[1]);
                if(new RegExp('\\{(.+?)\\}', 'g').test(context.file) || new RegExp('\\w{2,}://', 'g').test(context.file) || new RegExp('^git\\+', 'ig').test(context.file)){
                    // block not exist or filepath is not a system file path
                    context.logger.error.ln('filepath: ' + context.file + ', block not exist or filepath is not a system file path');
                    return handlerNext(context);
                }
                // join path
                context.file = path.join(context.dir, context.file);
                return Q.nfcall(fs.readFile, context.file).then(function(text) {
                    // reset regex lastIndex before the match string first index
                    context.regex.lastIndex = context.regex.lastIndex - context.matchs[0].length;
                    // trim the read file string
                    return text.toString().trim();
                }).then(function(text) {
                    if(!text || text.toString().trim() === ''){
                        // if the file string is empty, don't replace
                        context.page.content = context.page.content.substring(1, context.page.content.length - 1);
                        return context.page;
                    }
                    context.logger.debug.ln('match: ' + context.match + ', replace: true');
                    context.page.content = context.page.content.replace(context.match, text);
                    return handlerNext(context);
                }, function(error){
                    context.logger.error.ln(error);
                    return handlerNext(context);
                });
            };
            // add '\n' into page.content first and last
            page.content = '\n' + page.content + '\n';
            var context = {};
            context.blocks = {};
            context.page = page;
            context.logger = this.log;
            context.dir = path.dirname(page.rawPath);
            context.regex = /\ninclude::(.+?)\[.*?\](?=\n)/g;
            context.blockHandler = function(filepath){
                var regex = /\{(.+?)\}/ig;
                var matchs = regex.exec(filepath);
                while(matchs){
                    var key = matchs[1].toString().toLowerCase();
                    if(!context.blocks[key]){
                        // find block
                        var find = new RegExp('\\n:' + key + '\\s*:(.+?)\\n','i').exec(context.page.content);
                        if(!find){
                            // block not exists
                            context.logger.error.ln('filepath: ' + filepath + ', don\'t find block: ' + key);
                            matchs = regex.exec(filepath);
                            continue;
                        }
                        context.blocks[key] = find[1].toString().trim();
                    }
                    var oldFilepath = filepath;
                    // replace block
                    filepath = filepath.replace(new RegExp('\\{' + key + '\\}','ig'), context.blocks[key]);
                    context.logger.debug.ln('block: ' + key + ', oldFilepath: ' + oldFilepath + ', blockReplace: ' + filepath);
                    matchs = regex.exec(filepath);
                }
                return filepath;
            }
            return handlerNext(context);
        }
    }
};
