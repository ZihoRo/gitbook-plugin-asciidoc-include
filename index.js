var path = require('path');
var fs = require('fs');
var Q = require('q');
var is = require('is');

module.exports = {
    hooks: {

        "page:before": function(page) {
            if(!(page != undefined && page.type === 'asciidoc')){
                return page;
            }
            var logger = this.log;

            var charset = this.config.get('charset', 'UTF-8');

            var dir = path.dirname(page.rawPath);
            var joinPath = function(filename) {
                return path.join(dir, filename);
            };

            // find all include::url[] statements.
            var pattern = 'include::(.+)\\[.*\\]';
            var regex = new RegExp(pattern, 'ig');
            var matchs = regex.exec(page.content);
            var replaceHandlerArray = [];
            var match;
            var file;
            while (matchs) {
              match = matchs[0];
              file = matchs[1];
              logger.info.ln(match + ',' + file);
              replaceHandlerArray.push(Q.nfcall(fs.readFile, joinPath(file), charset).then(function(text) {
                      return text.toString().trim();
                  }).then(function(text) {
                      if(!(!text || text.toString().trim() === '')){
                          logger.debug.ln('replace:true');
                          page.content = page.content.replace(match, text);
                      }
                      return page;
                  })
              );
              matchs = regex.exec(page.content);
            }
            return Q.all(replaceHandlerArray).then(function(result){
                if(is.not.array(result) || result.length == 0){
                    return page;
                }
                logger.info.ln(result);
                return result[result.length - 1];
            });
        }
    }
};
