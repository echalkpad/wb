define(['command'], function(Command){

  var EmbedMapCommand = Command.extend({ //abstract
    name: 'embed_map',
    description: 'embed a map within the current map',
    parse: function(text){
      return {iri: text};
    },
    execute: function(){
      //TODO: check/handle circular references
      //TODO: create/embed new map (denote with bang? !mlanza:newmap)
      //TODO: ensure username prefix
      //TODO: highlight newly created topic maps in view? topics? etc.?
      var tm = this.subject, iri = this.options.iri, client = tm.client();
      client.fetch(iri, {reload: true, silent: true}).done(tm.embed_map);
      return tm;
    }
  });
  
  return EmbedMapCommand;

});