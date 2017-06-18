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
                context.logger.debug.ln('page: ' + context.page.content);
                context.matchs = context.regex.exec('\n' + context.page.content + '\n');
                context.logger.debug.ln('matchs: ' + context.matchs);
                if(!context.matchs){
                    return context.page;
                }
                context.match = context.matchs[0].trim();
                context.file = path.join(context.dir, context.blockHandler(context.matchs[1]));
                return Q.nfcall(fs.readFile, context.file, context.charset).then(function(text) {
                    return text.toString().trim();
                }).then(function(text) {
                    if(!text || text.toString().trim() === ''){
                        return context.page;
                    }
                    context.logger.debug.ln('match: ' + context.match + ', replace: true');
                    context.page.content = context.page.content.replace(context.match, text);
                    return handlerNext(context);
                });
            };
            var context = {};
            context.blocks = {};
            context.page = page;
            context.dir = path.dirname(page.rawPath);
            context.charset = this.config.get('charset', 'UTF-8');
            context.logger = this.log;
            context.regex = /\ninclude::(.+?)\[.*?\]\n/g;
            context.blockHandler = function(filepath){
                var regex = /\{(.+?)\}/ig;
                var matchs = regex.exec(filepath);
                while(matchs){
                    var key = matchs[1].toString().toLowerCase();
                    if(!context.blocks[key]){
                        var find = new RegExp('\\n:' + key + '\\s*:(.+?)\\n','i').exec(context.page.content);
                        context.logger.debug.ln('find: ' + find);
                        if(!find){
                            context.logger.error.ln('filepath: ' + filepath + ', don\'t find block: ' + key);
                            continue;
                        }
                        context.blocks[key] = find[1].toString().trim();
                    }
                    var oldFilepath = filepath;
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
