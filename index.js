module.exports = {
    hooks: {
        "page:before": function(page) {
            console.log('%s,%s','page1',page);
            if(page != undefined && ((page.path.test(/\.adoc$/) || page.path.test(/\.asciidoc$/)) || page.type === 'asciidoc')){
                page.content = page.content.replace(/include::(.+)\[.*\]/g,'{% include \"$1\" %}');
            }
            console.log('%s,%s','page2',page);
            return page;
        }
    }
};
