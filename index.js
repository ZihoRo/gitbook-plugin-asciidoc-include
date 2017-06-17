module.exports = {
    hooks: {
        "page:before": function(page) {
            var debug = this.output ? this.output.getLogger().debug.ln : console.log;
            debug('page:before type:' + (!page || page.type) + ',path:' + (!page || page.path) + ',page:' + page);
            if(page != undefined && ((page.path.test(/\.adoc$/) || page.path.test(/\.asciidoc$/)) || page.type === 'asciidoc')){
                page.content = page.content.replace(/include::(.+)\[.*\]/g,'{% include \"$1\" %}');
            }
            debug('page:before page:' + page);
            return page;
        }
    }
};
