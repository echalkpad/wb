var express  = require('express'),
		routes   = require('./routes'),
    user     = require('./routes/user'),
    http     = require('http'),
    path     = require('path'),
    _        = require('underscore'),
    $        = require('jquery'),
    fs       = require('fs'),
		mongo    = require('mongodb'),
		Backbone = require('backbone'),
		Server 	 = mongo.Server,
		Db		   = mongo.Db,
		ObjectID = mongo.ObjectID;
		
var app      = express(),
		server 	 = new Server('localhost', 27017, {auto_reconnect: true}, {}),
		db 			 = new Db('thingy', server); db.open(function() {});

//var Document = require('models/document');
//console.log('doc', Document);

var sendItems = function(cursor, res){
	var prefix = '';
	res.setHeader("Content-Type", "application/json");
  res.write('[');
	cursor.each(function(err, item){
		if (item != null) {
			res.write(prefix + JSON.stringify(item));
			prefix = ',';
		} else {
			res.write(']')
			res.end();
		}
	});
};

var temp = fs.readFileSync('/Users/mlanza/work/wb/amd-template.js').toString();

app.get('/amd/command.js', function(req, res){
	fs.readFile('/Users/mlanza/work/wb/public/js/command.js', function(error, content) {
	   if (error) {
	       res.writeHead(500);
	       res.end();
	   }
	   else {
	       res.writeHead(200, { 'Content-Type': 'text/javascript' });
	       res.end(temp.replace('__content__', content), 'utf-8');
	   }
	});
});

app.get('/person', function(req, res){
	var mario = new Person({name: "Mario T. Lanza", age: 40});
	debugger;
	res.send(mario);
});

app.get('*', function (req, res, next){
	console.log(req.accepted[0].value == 'text/html' , req.path, req.get('authorization') == undefined);
	if (req.accepted[0].value == 'text/html' && (req.path == '/maps' || req.path == '/maps/mlanza:contacts')) {
		fs.readFile('/Users/mlanza/work/wb/public/map-editor.html', function(error, content) {
		   if (error) {
		       res.writeHead(500);
		       res.end();
		   }
		   else {
		       res.writeHead(200, { 'Content-Type': 'text/html' });
		       res.end(content, 'utf-8');
		   }
		});
	} else {
		next();
	}
});

app.get('/maps', function (req, res){
	console.log(req.accepted)
	db.collection('topic_maps', function(err, topic_maps) {
		sendItems(topic_maps.find(), res);
	});
});

app.get('/maps/:id', function (req, res){
	db.collection('topic_maps', function(err, topic_maps) {
		var query = {};
		try {
			query = {_id: new ObjectID(req.params.id)};
		} catch(ex) {
			query = {iri: req.params.id};
		}
		topic_maps.findOne(query, function(err, item){
			db.collection('topics', function(err, topics){
				topics.find({topic_map_id: item._id}).toArray(function(err, items){
					item.topics = _.map(items, function(i){
						i.id = i._id;
						delete i._id;
						return i;
					});
					db.collection('associations', function(err, associations){
						associations.find({topic_map_id: item._id}).toArray(function(err, items){
							item.associations = _.map(items, function(i){
								i.id = i._id;
								delete i._id;
								return i;
							});
							item.embedded_map_ids = [];
							item.id = item._id;
							delete item._id;
							res.send(item);
						});
					});
				});
			});
		});
	});
});

app.get('/maps/:id/topics', function (req, res){
	db.collection('topics', function(err, topics) {
		sendItems(topics.find({topic_map_id: new ObjectID(req.params.id)}), res);
	});
});

app.get('/maps/:topic_map_id/topics/:topic_id', function (req, res){
	db.collection('topics', function(err, topics) {
		topics.findOne({topic_map_id: new ObjectID(req.params.topic_map_id), _id: new ObjectID(req.params.topic_id)}, function(err, item){
			res.send(item);
		});
	});
});

app.get('/maps/:id/associations', function (req, res){
	db.collection('associations', function(err, associations) {
		sendItems(associations.find({topic_map_id: new ObjectID(req.params.id)}), res);
	});
});

app.get('/maps/:topic_map_id/associations/:association_id', function (req, res){
	db.collection('associations', function(err, associations) {
		associations.findOne({topic_map_id: new ObjectID(req.params.topic_map_id), _id: new ObjectID(req.params.association_id)}, function(err, item){
			res.send(item);
		});
	});
});

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/users', user.list);
app.listen(3000);
