$(document).ready(function(){
	$.support.cors = true;
	var MYCLIENT = new client("http://localhost:8080/")
	var COLORGEN = new colorGenerator()
	var CLIENTLIST = new Object()
	$("#chat-login-button").click(function() {
		var name = $("#chat-login-name").val();
		var password = $("#chat-login-password").val();
		login(name, password);
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
			login(name, password);
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
			MYCLIENT.handleInput(el.value);
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
		var uri = MYCLIENT.server + "block";
		$.ajax({
			type: "POST",
			url: uri,
			data: JSON.stringify(name),
			contentType: "application/json",
			headers: {"Authorization":MYCLIENT.token},
			success: function(data, stat, resp) {
				if (resp.getResponseHeader("success") == "true") {
					addMessage("Now blocking " + clientHTML(name) + ".");
				}
				if (resp.getResponseHeader("code") == "30") {
					addMessage("You are already blocking " + clientHTML(name) + ".");
				}
				if (resp.getResponseHeader("code") == "32") {
					addMessage("You can't block yourself.");
				}
			},
			error: function(resp, stat, err) {
				addMessage(err);
				if (err == "Unauthorized") {
					resetLogin();
				}
			}
		})
	}
	function menuUnblock(name) {
		var uri = MYCLIENT.server + "unblock";
		$.ajax({
			type: "POST",
			url: uri,
			data: JSON.stringify(name),
			contentType: "application/json",
			headers: {"Authorization":MYCLIENT.token},
			success: function(data, stat, resp) {
				if (resp.getResponseHeader("success") == "true") {
					addMessage("No longer blocking " + clientHTML(name) + ".");
				}
				if (resp.getResponseHeader("code") == "31") {
					addMessage("You are not blocking " + clientHTML(name) + ".");
				}
			},
			error: function(resp, stat, err) {
				addMessage(err);
				if (err == "Unauthorized") {
					resetLogin();
				}
			}
		})

	}
	function menuFriend(name) {
		var uri = MYCLIENT.server + "friend";
		$.ajax({
			type: "POST",
			url: uri,
			headers: {"Authorization": MYCLIENT.token},
			data: JSON.stringify(name),
			contentType: "application/json",
			success: function(data, stat, resp) {
				if (resp.getResponseHeader("success") == "true") {
					addMessage(clientHTML(name) + " is now on your friends list.");
				}
				if (resp.getResponseHeader("success") == "false" && data != "") {
					addMessage(JSON.parse(data));
				}
			},
			error: function(resp, stat, err) {
				addMessage(err);
				if (err == "Unauthorized") {
					resetLogin();
				}
			}
		})
	}
	function menuUnfriend(name) {
		var uri = MYCLIENT.server + "unfriend";
		$.ajax({
			type: "POST",
			url: uri,
			headers: {"Authorization": MYCLIENT.token},
			data: JSON.stringify(name),
			contentType: "application/json",
			success: function(data, stat, resp) {
				if (resp.getResponseHeader("success") == "true") {
					addMessage(clientHTML(name) + " is no longer on your friends list.");
				}
				if(resp.getResponseHeader("success") == "false" && data != "") {
					addMessage(JSON.parse(data));
				}
			},
			error: function(resp, stat, err) {
				addMessage(err);
				if(err == "Unauthorized") {
					resetLogin();
				}
			}
		})
	}
	function resetLogin(){
		$("#chat-window").hide();
		$("#chat-new-account-window").hide();
		$("#chat-login-window").show();
		MYCLIENT.token = "";
		clearInterval(MYCLIENT.messageGetter);
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
	client.prototype.handleInput = function (command) {
		if(typeof command != "string") {
			return;
		}
		command.trim();
		if(command.charAt(0) != "/") {
			this.send(command);
			return;
		}
		var res = command.split(" ");
		switch(res[0]) {
			case "/join":
				if(res.length < 2) {
					addMessage("You must enter a room to join.");
					return;
				}
				this.join(res[1]);
				return;
			case "/list":
				this.list();
				return;
			case "/who":
				this.who(res[1]);
				return;
			case "/block":
				if(res.length < 2) {
					addMessage("You must enter a name to block.");
					return;
				}
				this.block(res[1]);
				return;
			case "/unblock":
				if(res.length <2) {
					addMessage("You must enter a name to unblock.");
					return;
				}
				this.unblock(res[1]);
				return;
			case "/quit":
				this.quit();
				return;
			case "/leave":
				this.leave();
				return;
			case "/blocklist":
				this.blocklist();
				return;
			case "/friend":
				if(res.length < 2) {
					addMessage("You must enter a name to friend.");
					return;
				}
				this.friend(res[1]);
				return;
			case "/unfriend":
				if(res.length < 2) {
					addMessage("You must enter a name to unfriend.");
					return;
				}
				this.unfriend(res[1]);
				return;
			case "/tell":
				if(res.length < 3) {
					addMessage("You must enter a client and a message.");
					return;
				}
				this.tell(res[1],res.slice(2).join(" "));
				return;
			default:
				addMessage("Invalid Command.");
		}
	}
	client.prototype.updateRoom = function() {
		var list;
		var i;
		var uri = this.server + "rooms/who";
		$.ajax({
			type: "GET",
			url: uri,
			headers: {"Authorization":this.token},
			success: function(data, stat, resp) {
				if (resp.getResponseHeader("success") == "true") {
					data = JSON.parse(data);
					rmName = data.Room;
					list = data.Clients;
					document.getElementById("chat-room-body").innerHTML = "";
					document.getElementById("chat-room-title").innerHTML = "Room-" + rmName;
					for (i=0; i < list.length;i++) {
						$("#chat-room-body").append(clientHTML(list[i]) + "<br>");
					}
				} else if (data != "") {
					addMessage(JSON.parse(data));
				}
			},
			error: function(resp, stat, err) {
				if (err == "Unauthorized") {
					resetLogin();
				}
			}
		})
	}
	client.prototype.updateFriendList = function() {
		var list;
		var i;
		var uri = this.server + "friendlist";
		$.ajax({
			type: "GET",
			url: uri,
			headers: {"Authorization": this.token},
			success: function(data, stat, resp){
				if (resp.getResponseHeader("success") == "true") {
					data = JSON.parse(data);
					document.getElementById("chat-friend-body").innerHTML = "";
					for (i = 0;i <data.length;i++) {
						$("#chat-friend-body").append(clientHTML(data[i].Name) + "- " + data[i].Room +"<br>");
					}
				} else if (data!= "") {
					addMessage(JSON.parse(data));
				}
			},
			error: function(resp, stat, err) {
				if (err == "unauthorized") {
					resetLogin();
				}
			}
		})
	}
	client.prototype.join = function(s){
		var uri = this.server + "rooms/" + s + "/join";
		$.ajax({
			type: "POST",
			url: uri,
			headers: {"Authorization":this.token},
			dataType: "text",
			success: function(data, stat, resp) {
				if(resp.getResponseHeader("success") != "true") {
					if (data != "") {
						addMessage(JSON.parse(data));
					}
				}
			},
			error: function(resp, stat, err) {
				addMessage(err);
				if (err == "Unauthorized") {
					resetLogin();
				}
			}
		})
	}
	client.prototype.list = function() {
		var uri = this.server + "rooms/list";
		$.ajax({
			type: "GET",
			url: uri,
			headers: {"Authorization":this.token},
			success: function(data, stat, resp) {
				if (resp.getResponseHeader("success") == "true") {
					var list = JSON.parse(data);
					addMessage("Rooms:")
					var i;
					for (i=0; i < list.length;i++) {
						addMessage(list[i]);
					}
				} else if (data != "") {
					addMessage(JSON.parse(data));
				}

			},
			error: function(resp, stat, err) {
				addMessage(err);
				if (err == "Unauthorized") {
					resetLogin();
				}
			}
		})
	}
	client.prototype.who = function(s) {
		var uri;
		var list;
		var i;
		if (s == undefined) {
			uri = this.server + "rooms/who";
		} else {
			uri = this.server + "rooms/" + s + "/who";
		}
		$.ajax({
			type: "GET",
			url: uri,
			headers: {"Authorization":this.token},
			success: function(data, stat, resp) {
				if (resp.getResponseHeader("success") == "true") {
					data = JSON.parse(data);
					rmName = data.Room;
					list = data.Clients;
					addMessage("Room: " + rmName);
					for (i=0; i < list.length;i++) {
						addMessage(clientHTML(list[i]));
					}
				} else if (data != "") {
					addMessage(JSON.parse(data));
				}
			},
			error: function(resp, stat, err) {
				addMessage(err);
				if (err == "Unauthorized") {
					resetLogin();
				}
			}
		})

	}
	client.prototype.block = function(s) {
		var uri = this.server + "block";
		$.ajax({
			type: "POST",
			url: uri,
			data: JSON.stringify(s),
			contentType: "application/json",
			headers: {"Authorization":this.token},
			success: function(data, stat, resp) {
				if (resp.getResponseHeader("success") == "true") {
					addMessage("Now blocking " + clientHTML(s) + ".");
				}
				if (resp.getResponseHeader("code") == "30") {
					addMessage("You are already blocking " + clientHTML(s) + ".");
				}
				if (resp.getResponseHeader("code") == "32") {
					addMessage("You can't block yourself.");
				}
			},
			error: function(resp, stat, err) {
				addMessage(err);
				if (err == "Unauthorized") {
					resetLogin();
				}
			}
		})

	}
	client.prototype.unblock = function(s) {
		var uri = this.server + "unblock";
		$.ajax({
			type: "POST",
			url: uri,
			data: JSON.stringify(s),
			contentType: "application/json",
			headers: {"Authorization":this.token},
			success: function(data, stat, resp) {
				if (resp.getResponseHeader("success") == "true") {
					addMessage("No longer blocking " + clientHTML(s) + ".");
				}
				if (resp.getResponseHeader("code") == "31") {
					addMessage("You are not blocking " + clientHTML(s) + ".");
				}
			},
			error: function(resp, stat, err) {
				addMessage(err);
				if (err == "Unauthorized") {
					resetLogin();
				}
			}
		})

	}
	client.prototype.quit = function() {
		var uri = this.server + "rooms/quit";
		$.ajax({
			type: "POST",
			url: uri,
			headers: {"Authorization":this.token},
			success: function(data, stat, resp) {
				if (resp.getResponseHeader("success") == "true") {
					resetLogin();
				} else if (data != "") {
					addMessage(JSON.parse(data));
				}
			},
			error: function(resp, stat, err) {
				addMessage(err);
				if (err == "Unauthorized") {
					resetLogin();
				}
			}
		})

	}
	client.prototype.leave = function() {
		var uri = this.server + "rooms/leave";
		$.ajax({
			type: "POST",
			url: uri,
			headers: {"Authorization":this.token},
			success: function(data, stat, resp) {
				if (resp.getResponseHeader("success") == "true") {
				} else if (data != "") {
					addMessage(JSON.parse(data));
				}
			},
			error: function(resp, stat, err) {
				addMessage(err);
				if (err == "Unauthorized") {
					resetLogin();
				}
			}
		})

	}
	client.prototype.tell = function(client, message) {
		var uri = this.server + "tell";
		if (client === undefined || message === undefined) {
			addMessage("You must enter a client and a message");
		}
		$.ajax({
			type: "POST",
			url: uri,
			data: JSON.stringify(client) + JSON.stringify(message),
			contentType: "application/json",
			headers: {"Authorization":this.token},
			success: function(data, stat, resp) {
				if (resp.getResponseHeader("success") == "false" && data !== undefined) {
					addMessage(JSON.parse(data));
				}
			},
			error: function(resp, stat, err) {
				addMessage(err);
				if (err == "Unauthorized") {
					resetLogin();
				}
			}
		})
	}
	client.prototype.send = function(s){
		var uri = this.server + "messages";
		$.ajax({
			type: "POST",
			url: uri,
			data: JSON.stringify(s),
			contentType: "application/json",
			headers: {"Authorization":this.token},
			success: function(data, stat, resp) {
				if (resp.getResponseHeader("success") == "true") {
				} else if (data != "") {
					addMessage(JSON.parse(data));
				}
			},
			error: function(resp, stat, err) {
				addMessage(err);
				if (err == "Unauthorized") {
					resetLogin();
				}
			}
		})
	}
	client.prototype.blocklist = function(){
		var uri = this.server + "blocklist";
		$.ajax({
			type: "GET",
			url: uri,
			headers: {"Authorization":this.token},
			success: function(data, stat, resp) {
				if (resp.getResponseHeader("success") == "true") {
					var list = JSON.parse(data);
					addMessage("Block List:")
					var i;
					for (i=0; i < list.length;i++) {
						addMessage(clientHTML(list[i]));
					}
				} else if (data != "") {
					addMessage(JSON.parse(data));
				}

			},
			error: function(resp, stat, err) {
				addMessage(err);
				if (err == "Unauthorized") {
					resetLogin();
				}
			}
		})
	}
	client.prototype.friend = function(s){
		var uri = this.server + "friend";
		$.ajax({
			type: "POST",
			url: uri,
			headers: {"Authorization": this.token},
			data: JSON.stringify(s),
			contentType: "application/json",
			success: function(data, stat, resp) {
				if (resp.getResponseHeader("success") == "true") {
					addMessage(clientHTML(s) + " is now on your friends list.");
				}
				if (resp.getResponseHeader("success") == "false" && data != "") {
					addMessage(JSON.parse(data));
				}
			},
			error: function(resp, stat, err) {
				addMessage(err);
				if (err == "Unauthorized") {
					resetLogin();
				}
			}
		})
	}
	client.prototype.unfriend = function(s) {
		var uri = this.server + "unfriend";
		$.ajax({
			type: "POST",
			url: uri,
			headers: {"Authorization": this.token},
			data: JSON.stringify(s),
			contentType: "application/json",
			success: function(data, stat, resp) {
				if (resp.getResponseHeader("success") == "true") {
					addMessage(clientHTML(s) + " is no longer on your friends list.");
				}
				if(resp.getResponseHeader("success") == "false" && data != "") {
					addMessage(JSON.parse(data));
				}
			},
			error: function(resp, stat, err) {
				addMessage(err);
				if(err == "Unauthorized") {
					resetLogin();
				}
			}
		})
	}

	function login(name,password) {
		var uri = MYCLIENT.server + "login";
		var login = {Name:name, Password:password};
		$.ajax({
			type: "POST",
			url: uri,
			dataType: "text",
			contentType: "application/json",
			data: JSON.stringify(login),
			error: function (resp, stat, err) {
				loginMessage("Error connecting to server");
				loginMessage(stat);
				loginMessage(err);
			},
			success: function(token, stat, resp) {
				if(resp.getResponseHeader("Success") == "true") {
					MYCLIENT.token = JSON.parse(token);
					MYCLIENT.updateRoom();
					MYCLIENT.updateFriendList();
					$("#chat-login-window").hide();
					$("#chat-window").show();
					MYCLIENT.messageGetter = setInterval(update, 1000);
					return
				}
				if(resp.getResponseHeader("code") == "21") {
					loginMessage("User name and password do not match.");
					return
				}
				if(resp.getResponseHeader("success") == "false") {
					loginMessage(token);
				}

			}
		});
	}
	function sendNewAccount() {
		if($("#chat-new-account-password").val() != $("#chat-new-account-password2").val()) {
			newAccountMessage("Passwords do not match.");
			return;
		}
		if(!validName($("#chat-new-account-name").val())) {
			newAccountMessage("Invalid name.  Name must be alphanumeric characters only.");
			return;
		}
		var uri = MYCLIENT.server + "register";
		var login = {Name: $("#chat-new-account-name").val(), Password: $("#chat-new-account-password").val()};
		$.ajax({
			type: "POST",
			url: uri,
			data: JSON.stringify(login),
			error: function(resp, stat, err) {
				newAccountMessage(err)
			},
			success: function(data, stat, resp) {
				if (resp.getResponseHeader("success") == "true") {
					resetLogin();
				}
			}
		});
	}

	function getMessages() {
		if (MYCLIENT.token == "") {
			return;
		}
//		MYCLIENT.updateRoom();
//		MYCLIENT.updateFriendList();
		var uri = MYCLIENT.server + "messages";
		$.ajax({
			type: "GET",
			url: uri,
			headers: {"Authorization":MYCLIENT.token},
			error: function (resp, stat, err) {
				if (err == "Unauthorized") {
					resetLogin();
				}
			},
			success: function(data, stat, resp) {
				if (resp.getResponseHeader("success") == "true") {
					var messages = JSON.parse(data);
					var i;
					for (i = 0; i<messages.length;i++) {
						addMessage(messages[i]);
					}
				}
			}
		})
	}
	function update() {
		if (MYCLIENT.token == "") {
			return;
		}
		var uri = MYCLIENT.server + "update";
		stuff = ["friendlist","messages","who"]
		$.ajax({
			type: "POST",
			url: uri,
			data: JSON.stringify(stuff),
			headers: {"Authorization":MYCLIENT.token},
			success: function(data, stat, resp) {
				if (resp.getResponseHeader("success") == "true") {
					data = JSON.parse(data);
					rmName = data.who.Room;
					list = data.who.Clients;
					document.getElementById("chat-room-body").innerHTML = "";
					document.getElementById("chat-room-title").innerHTML = "Room-" + rmName;
					for (i=0; i < list.length;i++) {
						$("#chat-room-body").append(clientHTML(list[i]) + "<br>");
					}
					document.getElementById("chat-friend-body").innerHTML = "";
					for (i = 0;i <data.friendlist.length;i++) {
						$("#chat-friend-body").append(clientHTML(data.friendlist[i].Name) + "- " + data.friendlist[i].Room +"<br>");
					}
					var messages = data.messages;
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

//						addMessage(messages[i]);
					}
				} else {
					addMessages("Error Updating");
				}
			},
			error: function (resp, stat, err) {
				if (err == "Unauthorized") {
					resetLogin();
				}
			}
		})
	}
});


