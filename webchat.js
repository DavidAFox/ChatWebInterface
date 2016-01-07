$(document).ready(function(){
	$.support.cors = true;
	var MYCLIENT = NewClient({server: "localhost:8080/"});
	var COLORGEN = new colorGenerator()
	var CLIENTLIST = new Object()
	$("#chat-login-button").click(function() {
		var name = $("#chat-login-name").val();
		var password = $("#chat-login-password").val();
		MYCLIENT.login(name, password);
	})
	$("#chat-login-name").keyup(function(e) {
		if(e.which == 13) {
			$("#chat-login-password").focus();
		}
	})
	$("#chat-login-password").keyup(function(e) {
		if(e.which == 13) {
			var name = $("#chat-login-name").val();
			var password = $("#chat-login-password").val();
			MYCLIENT.login(name, password);
		}
	})
	$("#chat-goto-new-account-button").click(function() {
		$("#chat-login-window").hide();
		$("#chat-new-account-window").show();
	})
	$("#chat-new-account-button").click(function() {
		sendNewAccount();
	})
	$("#chat-new-account-name").keyup(function(e) {
		if(e.which == 13) {
			$("#chat-new-account-password").focus();
		}
	})
	$("#chat-new-account-password").keyup(function(e) {
		if(e.which == 13) {
			$("#chat-new-account-password2").focus();
		}
	})
	$("#chat-new-account-password2").keyup(function(e) {
		if(e.which == 13) {
			sendNewAccount();
		}
	})
	$("#chat-input").keyup(function(e) {
		if(e.which == 13) {
			var el = document.getElementById("chat-input");
			MYCLIENT.execute(el.value);
			el.value = "";
		}
	})
	$(".chat-client-name").click(function() {
	})
	$("#chat-send-button").click(function() {
		var el = document.getElementById("chat-input");
		MYCLIENT.handleInput(el.value);
		el.value = "";
	})
	$(".chat-client-name").contextMenu({
		selector: ".chat-client-name",
		callback: function(key, options) {
			switch (key) {
				case "tell":
					menuTell(this.text());
					return;
				case "block":
					menuBlock(this.text());
					return;
				case "unblock":
					menuUnblock(this.text());
					return;
				case "friend":
					menuFriend(this.text());
					return;
				case "unfriend":
					menuUnfriend(this.text());
					return;
			}	
		},
		items: {
			tell: {name: "Tell"},
			block: {name: "Block"},
			unblock: {name: "Unblock"},
			friend: {name: "Friend"},
			unfriend: {name: "Unfriend"}
		}
	})
	function menuTell(name) {
		var el = document.getElementById("chat-input");
		el.value = "/tell " + name + " ";
		$("#chat-input").focus();
	}
	function menuBlock(name) {
		MYCLIENT.execute("/block " + name);
	}
	function menuUnblock(name) {
		MYCLIENT.execute("/unblock " + name)
	}
	function menuFriend(name) {
		MYCLIENT.execute("/friend " + name)
	}
	function menuUnfriend(name) {
		MYCLIENT.execute("/unfriend " + name)
	}
	function resetLogin(){
		$("#chat-window").hide();
		$("#chat-new-account-window").hide();
		$("#chat-login-window").show();
		MYCLIENT.quit();
		document.getElementById("chat-body").innerHTML = "";
	}

	function addMessage(message) {
		$("#chat-body").append(message+"<br/>");
		$("#chat-body").scrollTop(document.getElementById("chat-body").scrollHeight);
	}
	function loginMessage(message) {
		$("#chat-login-footer").append(message+"<br/>");
	}
	function newAccountMessage(message) {
		$(".chat-new-account-panel-body").append(message+"<br/>");
	}
	function validName(name) {
		if(name.search(/\W/) > 0) {
			return false;
		}
		return true;
	}
	function client(server) {
		this.server = server;
		this.token = "";
		this.inRoom = false;

	}
	function getStyleSheet(unique_title) {
		for(var i=0; i<document.styleSheets.length; i++) {
			var sheet = document.styleSheets[i];
			if(sheet.title == unique_title) {
				return sheet;
			}
		}
	}
	function clientHTML(name) {
		if (CLIENTLIST[name] === undefined) {
			var color = COLORGEN.getColor();
			var sheet = getStyleSheet("webchat");
			sheet.insertRule(".chat-client-name-" + name + " { color: " + color + ";}", 0);
			CLIENTLIST[name] = color;
		}
		return "<span class = 'chat-client-name chat-client-name-" + name + "'>" + name + "</span>";
	}



	function colorGenerator() {
		this.current = 0;
		this.colors = ["Red", "Green", "Blue", "Orange", "Brown", "Purple", "LightSeaGreen", "Black"];
	}
	colorGenerator.prototype.getColor = function() {
		if (this.current < this.colors.length) {
			this.current += 1;
		} else {
			this.current = 0;
		}
		return this.colors[this.current];
	}

	function sendNewAccount() {
		var name = $("#chat-new-account-name").val()
		var password1 = $("#chat-new-account-password").val()
		var password2 = $("#chat-new-account-password2").val()
		if(password1 != password2) {
			newAccountMessage("Passwords do not match.");
			return;
		}
		if(!validName(name)) {
			newAccountMessage("Invalid name.  Name must be alphanumeric characters only.");
			return;
		}
		MYCLIENT.register(name, password1);
	}

//_____________________________________________________________________________________________________________


	function updateFriendlist(friendlist) {
		document.getElementById("chat-friend-body").innerHTML = "";
		for (i = 0;i <friendlist.length;i++) {
			$("#chat-friend-body").append(clientHTML(friendlist[i].Name) + "- " + friendlist[i].Room +"<br>");
		}
	}
	function updateWholist(wholist) {
		document.getElementById("chat-room-body").innerHTML = "";
		document.getElementById("chat-room-title").innerHTML = "Room-" + wholist.Room;
		if (typeof wholist.Clients !== 'undefined') {
			for (i=0; i < wholist.Clients.length;i++) {
				$("#chat-room-body").append(clientHTML(wholist.Clients[i]) + "<br>");
			}
		}
	};
	function updateMessages(messages) {
		for (i = 0; i<messages.length;i++) {
			switch (messages[i].Type) {
				case "Tell":
					if (messages[i].ToReciever) {
						addMessage(messages[i].TimeString + "[From " + clientHTML(messages[i].Sender) + "]>>>: " + messages[i].Text);
					} else {
						addMessage(messages[i].TimeString + "<<<[To " + clientHTML(messages[i].Reciever) + "]: " + messages[i].Text);
					}
					break;
				case "Join":
					addMessage(clientHTML(messages[i].Subject) + " " + messages[i].Text);
					break;
				case "Server":
					addMessage(messages[i].Text);
					break;
				case "Send":
					addMessage(messages[i].TimeString + " [" + clientHTML(messages[i].Sender) + "]: " + messages[i].Text);
					break;
			}
		}
	};
	function updateLogin() {
		$("#chat-login-window").hide();
		$("#chat-window").show();
	};
	function newMessage(Command, Args) {
		message = {};
		message.Command = Command;
		message.Args = Args;
		return message
	};


	//config
	//connection = if connection === 'ajax' then it will use http otherwise it will default to a websocket if supported
	function NewClient(config) {
		var client = {}
		var conn
		var messageGetter
		function setUpConn() {
			if ('WebSocket' in window || config.connection === 'ajax'){
				conn = NewWebsocketConnection({
					server:  config.server,
					scheme: config.scheme,
					onmessage: onmessage
				})	
			} else {
   				conn = NewAjaxConnection({
   					server: config.server,
   					scheme: config.scheme,
   					onmessage: onmessage
   				})
 			}
   		}
   		setUpConn()
   		function onmessage(message) {
   			if (!message.Success) {
   				switch (message.Type.toLowerCase()) {
   					case "register":
	   					newAccountMessage(message.Data);
	   					return;
	   				case "login":
	   					loginMessage(message.Data);
	   					return;
	   				default:
		   				addMessage(message.Data);
		   				return;
		   			}   				
   			}
   			switch (message.Type.toLowerCase()) {
   				case "login":
   					client.getWholist();
   					client.getFriendlist();
   					updateLogin();
					messageGetter = setInterval(client.update, 1000);
   					break;
   				case "register":
   					newAccountMessage(message.Data)
   					break;
   				case "friendlist":
   					updateFriendlist(message.Data);
   					break;
   				case "who":
   					updateWholist(message.Data);
   					break;
   				case "messages":
   					updateMessages(message.Data);
   					break;
   				case "update":
   					updateFriendlist(message.Data.friendlist);
   					updateWholist(message.Data.who);
   					updateMessages(message.Data.messages);
   					break;
   				default:
   					if (message.String !== "")
   					addMessage(message.String);
   					break;
   			}
   		}
   		client.getWholist = function() {
   			if(typeof conn.send !== 'undefined') {
   				conn.send(newMessage("who"))
   			}
   		}
   		client.getFriendlist = function() {
   			if(typeof conn.send !== 'undefined') {
   				conn.send(newMessage("friendlist"))
   			}
   		}
   		client.execute = function(str) {
   			if (str.slice(0,1) === '/') {
   				str = str.slice(1)
   			} else {
   				str = 'send ' + str
   			}
   			var array = str.split(" ");
   			conn.send(newMessage(array[0], array.slice(1)))
   		};
   		client.update = function() {
   			client.getWholist();
   			client.getFriendlist();
   		};
   		client.login = function(user, password) {
   			if (typeof conn.send === 'undefined') {
   				setUpConn();
   			}
   			conn.send(newMessage("login", [user, password]))
   		};
   		client.register = function(user, password) {
   			if (typeof conn.send === 'undefined') {
   				setUpConn();
   			}
   			conn.send(newMessage("register", [user, password]))
   		};
   		client.quit = function() {
   			clearInterval(messageGetter);
   			conn = {};
   		}
   		return client
	};

	//config
	//server = the server address for the websocket connection
	//scheme = the scheme to use
	//onmessage = function to be called when a message is recieved

	function NewWebsocketConnection (config) {
		if (typeof config.server === 'undefined') {
			console.log("no server")
			return;
		}
		if (typeof config.scheme === 'undefined') {
			config.scheme = 'ws://'
		}
		const OPEN = 1;
		const CONNECTING = 0;
		var conn = {};
		var websocket = new WebSocket(config.scheme + config.server);
		var logged = false;

		websocket.onmessage = function (event) {
			var message = JSON.parse(event.data)
			if (message.Type === 'login' && message.Success) {
				logged = true;
			}
			if (typeof config.onmessage === 'function') {
				config.onmessage(message);
			} else {
				console.log("onmessage not function");
			}
		};
		websocket.onerror = function() {
			resetLogin();
			websocket.close()
		}
		conn.ready = function() {
			return logged
		};
		conn.send = function(message) {
			if (websocket.readyState === OPEN) {
				websocket.send(JSON.stringify(message));
			} else if (websocket.readyState === CONNECTING) {
				setTimeout(function(){websocket.send(JSON.stringify(message))}, 1000)
			} else {
				conn.close();
				resetLogin();
				logged = false;
			}
		};
		conn.close = function() {
			websocket.close();
		}
		return conn;
	};

	function NewAjaxConnection(config) {
		if (typeof config.server === 'undefined') {
			return
		}
		if (typeof config.scheme === 'undefined') {
			config.scheme = 'http://'
		}
		var conn = {};
		var token = "";
		var messageGetter;
		conn.send = function(message) {
			var uri = config.scheme + config.server + message.Command
			$.ajax({
				type: "POST",
				url: uri,
				headers: {"Authorization": token},
				data: JSON.stringify(message.Args),
				error: function (resp, stat, err) {
					if (err == "Unauthorized") {
						resetLogin();
						token = "";
						clearInterval(messageGetter);
					}
				},
				success: function(data, stat, resp) {
					var response = {};
					var info = JSON.parse(data);
					if(typeof info.Data != 'undefined' && typeof info.String != 'undefined') {
						response.Data = info.Data;
						response.String = info.String
					} else {
						response.Data = info
					}
					response.Success = (resp.getResponseHeader("success") === "true");
					response.Code = parseInt(resp.getResponseHeader("code"));
					response.Type = message.Command;
					onmessage(response);
				}
			});
		};
		function onmessage(message) {
			if (message.Type === 'login' && message.Success) {
				token = message.Data;
				messageGetter = setInterval(getMessages, 1000);
			}
			config.onmessage(message)
		};
		function getMessages() {
			var uri = config.scheme + config.server + "messages"
			$.ajax({
				type: "GET",
				url: uri,
				headers: {"Authorization": token},
				error: function (resp, stat, err) {
					if (err == "Unauthorized") {
						resetLogin();
						token = "";
						clearInterval(messageGetter);
					}
				},
				success: function(data, stat, resp) {
					var response = {}
					response.Data = JSON.parse(data);
					response.Success = (resp.getResponseHeader("success") === "true");
					response.Code = parseInt(resp.getResponseHeader("code"));
					response.Type = "messages";
					onmessage(response);
				}
			})
		}
		conn.ready = function() {
			return token != "";
		};
		return conn
	};
});


