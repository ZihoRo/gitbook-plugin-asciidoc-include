require('gitbook-core')

module.exports = {
    hooks: {
        "page:before": function(page) {
            var logger = this.output.getLogger();
            logger.debug.ln('page:before:pre :' + page);
            if(page != undefined && ((page.path.test(/\.adoc$/) || page.path.test(/\.asciidoc$/)) || page.type === 'asciidoc')){
                page.content = page.content.replace(/include::(.+)\[.*\]/g,'{% include \"$1\" %}');
            }
            logger.debug.ln('page:before:post :' + page);
            return page;
        }
    }
};
