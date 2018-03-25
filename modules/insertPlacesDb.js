module.exports =
{
	insertPlaces : function(req, res, callback){
		//console.log("inside insertPlaces():"+req);
		var result = false;
		var MongoClient = require('mongodb').MongoClient;
		var url = 'mongodb://ajay2709:ajay2112@ds223268.mlab.com:23268/businessrecommendersystem';
		var data = req;
		//console.log("hereeeeeeee"+JSON.stringify(data));
		MongoClient.connect(url, function(err, db){
			if(err) throw err;
			//find({"id":data.id}).toArray().length == 0)
			db.collection("places").update({"id":data.id}, data, {upsert:true},function(err, result){
				//console.log("here33333333333");
					if(err) throw err;
					result = true;
					//console.log("db operation result:"+result);
					db.close();
					callback(result, res);
				});	
		});
	}
}
