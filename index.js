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
                    return context.page;
                }
                context.match = context.matchs[0].trim();
                context.file = context.blockHandler(path.join(context.dir, context.matchs[1]));
                return Q.nfcall(fs.readFile, context.file, context.charset).then(function(text) {
                    return text.toString().trim();
                }).then(function(text) {
                    if(!text || text.toString().trim() === ''){
                        return context.page;
                    }
                    context.logger.debug.ln('replace:true');
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
            context.regex = /\ninclude::(.+)\[.*\]\n/ig;
            context.blockHandler = function(filepath){
                var regex = /\{(.+)\}/ig;

                var matchs = regex.exec(filepath);
                while(matchs){
                    var key = matchs[1].toString().toLowerCase();
                    if(!context.blocks[key]){
                        var find = new Regexp('\\n:' + key + '\\s*:(.+)\\n','ig').exec(context.page.content);
                        if(!find){
                            continue;
                        }
                        context.blocks[key] = find[1].toString().trim();
                    }
                    filepath = filepath.replace(new Regexp('\\{' + key + '\\}','ig'), context.blocks[key]);
                    context.logger.info.ln('blockReplace: ' + filepath);
                    matchs = regex.exec(filepath);
                }
                return filepath;
            }
            // var result = handlerNext(context);
            // var id;
            // var sleep = function(){
            //     if(!Q.isPending(result)){
            //         context.logger.debug.ln('handlerNext:' + context.file + ', ' + context.match);
            //         context.logger.info.ln(typeof result);
            //         clearInterval(id);
            //         return;
            //     }
            // };
            // id = setInterval(sleep, 100);
            // return result;
            return handlerNext(context);
        }
    }
};
