module.exports = {
    blocks: {

    },

    hooks: {
        "page:before": function(page) {
            console.log(page);
            if(page!=undefined && ((page.type == undefined && page.path.test(/adoc$/)) || page.type === "asciidoc")){
                page.content = page.content.replace(/include::(.+)\[.*\]/g,"{% include \"$1\" %}");
            }
            console.log(page);
            return page;
        }
    }
};
