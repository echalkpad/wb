define(['class', 'backbone', 'change_log', 'models/user', 'models/topic_map', 'database'], function(Class, Backbone, ChangeLog, User, TopicMap, Database){

  //A client and db object shoudl provide the same interface.  The client is different only in that it attempts to fulfill requests not only from the local cache but also across the network.
  var Client = Class.extend({
    init: function(login, token, db){
      _.bindAll(this);
      var self = this;
      db = this.db = db || new Database();
      db.each(function(collection, key){
        collection.options = collection.options || {};
        collection.options.client = self;
        self[key] = function(extended){
          _.extend(extended, { //TODO: provide actual network assistance to get/query.
            add: function(item){
              return collection.add(item);
            },
            get: function(id){
              return collection.get(id);
            },
            query: function(){
              return collection.query.apply(collection, arguments);
            }
          });
          return extended;
        }(Object.create(collection));
      });
      this.login(login, token);
    },
    login: function(login, token){
      this.token = token;
      this.user = new User({id: login || 'admin', groups: ['ruby', 'javascript']}); //TODO: supply actual user
    },
    create: function(data, fn){
      var tm = new TopicMap(data);
      this.topic_maps.add(tm);
      fn && fn.call(tm, tm);
      return tm;
    },
    get: function(identifier){
      var token = this.token;
      return $.ajax({
        url: '/maps/' + identifier, //an id or iri
        dataType: 'json',
        accept: 'application/json',
        beforeSend : function(req) {
          req.setRequestHeader('Authorization', "Basic " + token);
        }
      });
    },
    fetch: function(iri, options){
      options = _.defaults(options || {}, {silent: false, creation: true}); //TODO: add reload option to get fresh data from db?
      var self = this, topic_maps = this.topic_maps, local = topic_maps.query().iri(iri).first();
      options.silent || this.trigger('fetching', iri);
      var dfd = $.Deferred(function($d){
        if (local){
          $d.resolve(local, 'reloaded');
        } else {
          self.get(iri).done(function(data, status, xhr){
            self.load(data, {silent: options.silent}).done(function(tm){
              $d.resolve(tm, 'loaded');
            });
          }).fail(function(jqXHR, textStatus, errorThrown){
            if (jqXHR.status === 404 && options.creation) { //not found
              $d.resolve(self.create({iri: iri}), 'created');
            } else {
              $d.reject({xhr: jqXHR, textStatus: textStatus, errorThrown: errorThrown});
            }
          });
        }
      });

      if (!options.silent) { //TODO:  use promises externally instead of triggers?
        dfd.done(function(tm, status){
          self.trigger('fetched', tm, status);
          self.trigger('fetched:' + status, tm);
        }).fail(function(resp){
          self.trigger('fetching:failed', iri, resp);
        }).always(function(){
          self.trigger('fetch', iri);
        });
      }

      return dfd.promise();
    },
    load: function(data, options){ //one or more topic_maps (more when including embedded)
      options = _.defaults(options || {}, {silent: false});
      var self = this, collection = this.db.topic_maps, topic_maps = _.isArray(data) ? data : [data], id = topic_maps[0].id;

      //manage load order so that a map is loaded only when its dependencies are already loaded
      var next = function(topic_maps){
        var batch = topic_maps.select(function(tm){
          return tm.embedded_map_ids.length === 0 || tm.embedded_map_ids.all(function(id){
            return !!collection.get(id);
          });
        });
        batch.each(function(tm){
          topic_maps.take(tm);
        });
        return batch;
      };

      var dfd = $.Deferred(function($d){
        setTimeout(function(){
          while(topic_maps.length > 0){
            var batch = next(topic_maps);
            _.each(batch, function(data){
              var tm = new TopicMap(data, {client: self});
              collection.add(tm);
            });
          };

          var tm = collection.get(id);

          tm ? $d.resolve(tm) : $d.reject(id);
        }, 25)
      });

      if (!options.silent) {
        dfd.done(function(tm){
          self.trigger('loaded', tm);
        }).fail(function(id){
          self.trigger('load:failed', id);
        });
      }

      return dfd.promise();
    }
  });

  _.extend(Client.prototype, Backbone.Events);

  return Client;

});
