var path = require('path');
var fs = require('fs');
var Q = require('q');
var request = require('request');
var rp = require('request-promise');

module.exports = {
    hooks: {
        "page:before": function(page) {
            if(!page || page.type !== 'asciidoc' || !page.content || (typeof page.content) !== 'string'){
                if(!page){
                    this.log.error.ln('page: ' + page);
                } else if(page.type !== 'asciidoc'){
                    this.log.error.ln('page.type: ' + page.type);
                } else if(!page.content) {
                    this.log.error.ln('page.content: ' + page.content);
                } else if((typeof page.content) !== 'string') {
                    this.log.error.ln('(typeof page.content): ' + (typeof page.content));
                }
                return page;
            }
            var replaceSyntax = this.config.get('pluginsConfig.asciidoc-include.syntax');
            this.log.debug.ln('replaceSyntax: ' + replaceSyntax);
            if(replaceSyntax === 'gitbook'){
                // can't support asciidoc include block
                page.content = page.content.replace(/\ninclude::(.+?)\[.*?\](?=\n)/g, '\n{% include "$1" %}');
                return page;
            }
            if(replaceSyntax !== 'asciidoc'){
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
                context.logger.debug.ln('----------------file: ' + context.file + ', matchs[1]: ' + context.matchs[1]);
                if(new RegExp('\\{(.+?)\\}', 'g').test(context.file) || new RegExp('^git\\+', 'ig').test(context.file)){
                    // block not exist or filepath is not a system file path
                    context.logger.error.ln('filepath: ' + context.file + ', block not exist or filepath is not a system file path');
                    return handlerNext(context);
                }
                // join path
                var uriReg = /^http(s?):\/\/.+/ig;

                var result;
                if(uriReg.test(context.file)){
                    // uri
                    if(!context.allowUriRead){
                        return handlerNext(context);
                    }
                    var options = {
                        uri: context.file,
                        headers: {
                            'User-Agent': 'Request-Promise',
                            'Content-Type': 'text/plain;charset=utf8'
                        },
                        json: false
                    };
                    result = rp(options);
                } else {
                    // file
                    context.file = path.join(context.dir, context.file);
                    result = Q.nfcall(fs.readFile, context.file);
                }
                return result.then(function(text) {
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
                        context.logger.debug.ln('----------------match: ' + context.match + ', replace: true');
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
            var allowUriRead = /\n:allow-uri-read\s*:\s*\n/ig;
            context.allowUriRead = allowUriRead.test(page.content);
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
                            context.logger.error.ln('----------------filepath: ' + filepath + ', don\'t find block: ' + key);
                            matchs = regex.exec(filepath);
                            continue;
                        }
                        context.blocks[key] = find[1].toString().trim();
                    }
                    var oldFilepath = filepath;
                    // replace block
                    filepath = filepath.replace(new RegExp('\\{' + key + '\\}','ig'), context.blocks[key]);
                    context.logger.debug.ln('----------------block: ' + key + ', oldFilepath: ' + oldFilepath + ', blockReplace: ' + filepath);
                    matchs = regex.exec(filepath);
                }
                return filepath;
            }
            return handlerNext(context);
        }
    }
};
