(function() {
var webpage = require('webpage');
var mocha = require('./lib/mocha-phantom.js').create({reporter:'spec', timeout:1000*60*5});
require('./lib/expect.js');

mocha.setup('bdd');

// テストの定義
describe('認証テスト', function() {
	// pageオブジェクトを作成
	var page = webpage.create();
	// 画面のサイズを設定
	page.viewportSize = {width: 320, height: 480};
	
	/**
	 * 指定したアカウントの認証Cookieデータを取得
	 * @param {String} account
	 * @param {String} password
	 * @param {Function} callback
	 */
	function getAuthCookieData(account, password, callback) {
		// Cookieクリア
		phantom.clearCookies();
		
		// 指定したページをオープン
		page.open('http://localhost:8080', function(status) {
			if (status !== 'success') {
				console.log('error!');
				phantom.exit();
				return;
			}
			
			// ログインボタン押下時にも再度openイベントが走ってしまうため、
			// ここで終わらせる。
			if (page.url.match('\/top$')) {
				return;
			}
			
			page.evaluate(function(account, password) {
				$('#account').val(account);
				$('#password').val(password);
			}, account, password);
			
			// ログインボタンの位置を取得
			var btnClickPosition = page.evaluate(function() {
				var btnShowModal = $('#login_btn').get(0);
				var rect = btnShowModal.getBoundingClientRect();
				
				var sx = (btnShowModal.screen) ? 0 : document.body.scrollLeft;
				var sy = (btnShowModal.screen) ? 0 : document.body.scrollTop;
				var position = {
					left: Math.floor(rect.left + sx),
					top: Math.floor(rect.top + sy),
					width: Math.floor(rect.width),
					height: Math.floor(rect.height)
				};
				
				return {
					left: Math.round(position.left + position.width / 2),
					top: Math.round(position.top + position.height / 2)
				};
			});
			
			// ボタンをクリックしてログインする
			page.sendEvent('click', btnClickPosition.left, btnClickPosition.top);
			
			// submit処理のため１秒待つ
			setTimeout(function() {
				callback(phantom.cookies);
			}, 1000);
		});
	}
	
	var authCookieData = {};
	
	// テストの前処理の記述
	before(function(done) {
		// user1,user2の認証Cookieデータを取得
		getAuthCookieData('user1', 'user1password', function(user1Cookie) {
			authCookieData['user1'] = user1Cookie;
			getAuthCookieData('user2', 'user2password', function(user2Cookie) {
				authCookieData['user2'] = user2Cookie;
				done();
			});
		});
	});
	
	describe('user1でログイン', function() {
		before(function(done) {
			// Cookieクリア
			phantom.clearCookies();
			// user1の認証Cookieデータをセット
			var cookies = authCookieData.user1;
			for (var i=0; i < cookies.length; i++) {
				phantom.addCookie(cookies[i]);
			}
			page.open('http://localhost:8080', function(status) {
				if (status !== 'success') {
					console.log('error!');
					phantom.exit();
					return;
				}
				// 画面のキャプチャ
				page.render('./capture/user1_auth.png');
				done();
			});
		});
		
		describe('表示チェック', function() {
			it('ユーザー名', function() {
				var welcomeText = page.evaluate(function() {
					return $('#main h4').text();
				});
				expect(welcomeText).to.be('ようこそuser1さん！');
			});
		});
	});
	
	describe('user2でログイン', function(done) {
		before(function(done) {
			// Cookieクリア
			phantom.clearCookies();
			// user2の認証Cookieデータをセット
			var cookies = authCookieData.user2;
			for (var i=0; i < cookies.length; i++) {
				phantom.addCookie(cookies[i]);
			}
			page.open('http://localhost:8080', function(status) {
				if (status !== 'success') {
					console.log('error!');
					phantom.exit();
					return;
				}
				// 画面のキャプチャ
				page.render('./capture/user2_auth.png');
				done();
			});
		});
		
		describe('表示チェック', function() {
			it('ユーザー名', function() {
				var welcomeText = page.evaluate(function() {
					return $('#main h4').text();
				});
				expect(welcomeText).to.be('ようこそuser2さん！');
			});
		});
	});
	
	after(function() {
		// PhantomJSの終了
		phantom.exit();
	});
});

// テストの実行
var runner = mocha.run();
})();