var fs = require('fs');
var path = require('path');
var express = require('express');

// base directory
var basedir = __dirname;

// creating express server
var app = express.createServer();
app.configure(function() {
	// setting view
	app.set('view engine','jade');
	app.set('views', path.join(basedir, '/views'));
	
	// basic gzip static content
	app.use(express['static'](path.join(basedir,'/public')));
	
	// express standard use
	app.use(express.bodyParser());
	app.use(express.cookieParser());
//	app.use(express.methodOverride());
	
	// router
	app.use(app.router);
});


// set routing
(function(app) {
	
	function checkAuth(req, res, next) {
		var authInfo = req.cookies.auth;
		if (authInfo) {
			next();
		} else {
			res.redirect('/login');
		}
	}
	
	app.get('/', checkAuth, function(req, res) {
		res.redirect('/top');
	});
	
	app.get('/top', checkAuth, function(req, res) {
		res.render('top.jade', {account:req.cookies.auth});
	});
	
	app.get('/login', function(req, res) {
		res.render('login.jade');
	});
	
	
	var accounts = {
		'user1': 'user1password',
		'user2': 'user2password'
	};
	
	function isAuth(account, password) {
		if (account in accounts) {
			return (accounts[account] === password) ? true : false;
		} else {
			return false;
		}
	}
	
	app.post('/login', function(req, res) {
		var account = req.param('account');
		var password = req.param('password');
		
		if (isAuth(account, password)) {
			// 有効期限24時間で認証情報をCookieに保存
			res.cookie('auth', account, { expires: new Date(Date.now() + 1000*60*60*24)});
			res.redirect('/top');
		} else {
			res.render('login.jade', {invalid:true});
		}
	});
	
	app.get('/logout', function(req, res) {
		res.clearCookie('auth');
		res.redirect('/');
	});
	
	app.get('/modal', function(req, res) {
		res.clearCookie('auth');
		res.render('modal.jade');
	});
	
})(app);


var port = 8080;
app.listen(port);

console.log('server started on port', port);