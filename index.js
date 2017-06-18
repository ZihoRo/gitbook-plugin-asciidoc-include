var path = require('path');
var fs = require('fs');

module.exports = {
    hooks: {

        "page:before": function(page) {
            if(!(page != undefined && page.type === 'asciidoc')){
                return page;
            }
            var logger = this.log;

            var charset = this.config.get('charset', 'UTF-8');

            var dir = path.dirname(page.rawPath);

            // find all include::url[] statements.
            var pattern = 'include::(.+)\\[.*\\]';
            var regex = new RegExp(pattern, 'ig');
            var matchs = regex.exec(page.content);
            while (matchs) {
              logger.info.ln(match + ',' + file);
              page.content = page.content.replace(matchs[0], fs.readFileSync(path.join(dir, matchs[1]), charset).trim());
              matchs = regex.exec(page.content);
            }
            return page;
        }
    }
};
