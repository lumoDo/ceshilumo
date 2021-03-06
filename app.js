var superagent = require('superagent');
var cheerio = require('cheerio');
var asyncc = require('async');
var express =require('express');
// 建立 express 实例
var app = express();
var url = require('url');

var cnodeUrl = 'https://cnodejs.org/';
app.get('/', function (req, ares, next) {
superagent.get(cnodeUrl).end(function(err, res) {
    if (err) {
        return cnosole.error(err);
    }
    var topicUrls = [];
    var $ = cheerio.load(res.text);
    $('#topic_list .topic_title').each(function(idx, element) {
        var $element = $(element);
        var href = url.resolve(cnodeUrl, $element.attr('href'));
				topicUrls.push(href);
         if (topicUrls.length>10) {
    				 	return false;
    				 }
    });
		//调用async并发函数，topicUrls为网址数组，并发数量为5，请求函数，请求成功函数
		asyncc.mapLimit(topicUrls, 5, function (topicUrl, callback) {
		  // fetchUrl(url, callback);
			//superagent get请求topicUrl，数组的循环单个网址，callback返回成功函数传递到
			superagent.get(topicUrl).end(function(err, res) {
			        console.log('fetch：' + topicUrl + 'successful');
							//调用下面函数
							callback(null,[topicUrl, res.text]);

			    });
		}, function (err, topics) {
			//接受callback返回的数组数据  并使用.map(function(){})返回一个新的数组
			topics = topics.map(function(topicPair) {
					var topicUrl = topicPair[0];
					var topicHtml = topicPair[1];
					var $q = cheerio.load(topicHtml);
					return ({
							title: $q('.topic_full_title').text().trim(),
							href: topicUrl,
							comment1: $q(".reply_content").eq(0).text().trim(),
							author1: $q('.user_name .dark').text(),
							score1: $q('.big').text()
					});
			});
       ares.send(topics);
		});
});
});
app.listen(process.env.PORT || 5000);
// app.listen(3000, function (req, res) {
//   console.log('app is running at port 3000');
// });
