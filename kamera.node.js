
module.exports = function(RED) {
"use strict";
//const execSync  = require("child_process").execSync;
//const http = require('http');
const spawn = require('child_process').spawn;
//const server = http.createServer();

	function kameraNode(config) {
		RED.nodes.createNode(this,config);
			this.name = config.name;
			this.timeout = config.timeout;
			this.rotate180 = config.rotate180;
			this.hflip = config.hflip;
			this.vflip = config.vflip;
			//this.camerainfo = config.camerainfo;
			this.autoclick = config.autoclick;
			this.screeninfo = config.screeninfo;

			this.htmlafter = config.htmlafter;
			this.base64 = config.base64;
				this.coding = this.base64 ? 'base64' : 'binary';
			this.size = (config.size);
			this.sizeXY = (config.size).split('x');
			this.X = '640';
			this.Y = '480';
			if (this.sizeXY) {this.X=this.sizeXY[0]; this.Y=this.sizeXY[1]; }
			this.args = ["-w", this.X, "-h", this.Y, "-o", "-"];
				if (this.hflip)   {this.args = this.args.concat(['-hf']);}
				if (this.vflip)   {this.args = this.args.concat(['-vf']);}
				if (this.rotate180)   {this.args = this.args.concat(['-rot', '180']);}
				if (this.screeninfo)  {this.args = this.args.concat(['-a', this.screeninfo]);}
				if (this.timeout)     {this.args = this.args.concat(['-t', this.timeout]);}
				this.extrameta ='<title>CamPI</title>';			
				if (this.autoclick!=0) this.extrameta += '<meta http-equiv="refresh" content="'+this.autoclick+'">';

		var node = this;
		this.on('input', function(msg) {
			this.argumenty = this.args.join(' ');
			console.log('1 argumenty=== \nraspistill ',this.argumenty);
			
			this.status({fill:"red",shape:"ring",text:"Waiting for kamera"});
			
			/*-----------------------*/
				//console.log('node.args=',node.args);
				//console.log('node.camerainfo=',node.camerainfo);
				//console.log('node.autoclick=',node.autoclick);
				//console.log('node.htmlafter=',node.htmlafter);
				
				let child = spawn('raspistill',node.args);

						var tablica =[];
						var msgerror = node.X+'x'+node.Y+' ';

						child.stdout.on('data', function(buff){
							//console.log('buff.length=',buff.length);
							tablica.push(buff);
						});

						child.stdout.on('end', function(s){
							//console.log('coding=',node.coding);
							let bufarr = Buffer.concat(tablica);
							console.log('bufarr.length=',bufarr.length);
							
							
							if (node.coding==='binary') {
								//let bufstr1 = bufarr.toString(node.coding);
								let bufstr1 = bufarr;
								msg.payload = bufstr1;
							}
							if (node.coding==='base64') {
								let bufstr2 = bufarr.toString(node.coding);
								msg.payload = node.extrameta+'<img src="data:image/jpeg;base64,'+bufstr2+'" style="max-width:100%;" /><br /><br /><button onClick="location.reload()">Shot</button>'
								//+' <button onClick="setInterval(function(){location.reload()},10000)"> re 10s</button>'
								//+' <button onClick="setInterval(function(){location.reload()},60000)"> re 1min</button>'
								//<button onClick="setInterval(function(){location.reload()},10000)"> reload 10s</button>
								+node.htmlafter;
							}
							
							let msg1={"payload":msgerror+"\n"+node.argumenty};
							console.log('poszlo -------------------')
							node.send([msg,msg1]);
							node.status({fill:"blue",shape:"dot",text:"Success: "+node.size+ ','+msg.payload.length+' bytes'});
						});

						child.stderr.on('data', function(s){
							msgerror += s.toString();
							console.log('msgerror=',msgerror);
						});
						child.on('error', function(s){
							msgerror += s.toString();
							console.log('on error=',msgerror);
						});
				
				
				
					/*
					let context = this.context();
					let kameracount = context.get('kameracount') || 0;
					kameracount += 1;
					msg.payload = 1;
					let msg1={"payload":2};
					node.send([msg,msg1]);
					node.status({fill:"blue",shape:"dot",text:"Success: "+node.size});
					*/
		});
	}
	RED.nodes.registerType("kamera",kameraNode);
}
