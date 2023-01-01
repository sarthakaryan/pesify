var express = require("express");
var bodyParser = require('body-parser')
var cookie = require("cookie")	
var app = express();
var http = require("http");
const { Server } =  require("socket.io");
const cors = require("cors")
const path = require('path');
var mongoose = require('mongoose');
mongoose.connect('mongodb+srv://sarthakaryan:pass123@cluster0.505fje9.mongodb.net/pesify');
var conn = mongoose.connection;

const cookieParser = require('cookie-parser');
app.use(cookieParser());
app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
var name = "";
const server = http.createServer(app);
const io = new Server(server,{
	cors:{
		origin:"*",
		methods: ["GET","POST"]
	},
	path : "/api/socket"
});

app.use('/global',express.static(path.join(__dirname, 'globalchat/build')));

app.post("/setUsername",(req,res)=>{
	name = req.body.name;
	res.cookie('userName',req.body.name)
	res.redirect("/global")
})

app.use("/global/latest",(req,res)=>{
	conn.collection('messages').find().sort({$natural:-1}).limit(20).toArray((err,result)=>res.json(result.reverse()));
})
app.use("/",express.static(__dirname + "/home/build/"))

io.on('connection', function(socket){
	try {
  		var cookies = cookie.parse(socket.handshake.headers.cookie);
    	name = cookies.userName;
    	if(name==""){
    		socket.emit("alert","Please set username first!")
    	}
    	else if(name.length<3) {
    		socket.emit("alert","Username must be at least 3 characters long")
    	}
	}
	catch(err) {
  		socket.emit("alert","Please set username first!")
	}
    if (name.length>=3) {
	    var id = socket.id;
	    let date = new Date();
	    let newId = "";
	    for(let i=0; i<id.length-15;i++){
	    	newId += String(id.charCodeAt(i));
	    }
	    newId = newId.slice(0,10)
	    var alertdata = {"name":name,"id":newId,"alert":"joined","time":date}
		socket.broadcast.emit("getAlert",alertdata)
		socket.emit("getAlert",alertdata)

		socket.on('send-message', function(data){
			if(data.message.length>0){
				var msgdata = {'uname':cookies.userName,'id':newId,"time":data.time,"msg":data.message}
				conn.collection('messages').insertOne(msgdata);
				socket.broadcast.emit("getMessage",msgdata)
				socket.emit("getMessage",msgdata)
			}
		})
	}
})

server.listen(5000,(err)=>{console.log("server started on port 5000")})
