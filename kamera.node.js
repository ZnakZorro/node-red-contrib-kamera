
module.exports = function(RED) {
	"use strict";
	//const fs = require('fs');
	const execSync  = require("child_process").execSync;
	//const exec      = require("child_process").exec;
	
    function kameraNode(config) {
        RED.nodes.createNode(this,config);
        this.name = config.name;
        this.interval = config.interval;
        this.repeat = config.repeat;
        this.timerepeat = config.timerepeat;
        this.checkrepeat = config.checkrepeat;
        this.BLEonoff = config.BLEonoff;
        this.readdata = config.readdata;
        this.readbatt = config.readbatt;
        this.bariera = parseInt(config.bariera);
		
        var node = this;
        this.on('input', function(msg) {
//0x038 = 4a 10 32 2e 36 2e 32 = 1bajt = bateria, reszta firmave 
			
			this.status({fill:"red",shape:"ring",text:"Waiting for kamera"});
			let that = this;
			let exeData ='gatttool --device='+this.name+' --char-read -a 0x35 --adapter=hci0';
			let exeBatt ='gatttool --device='+this.name+' --char-read -a 0x038 --adapter=hci0';
			let licznik = 1;
			
			function ble_on_off(state,sleep){
var exon='sudo bluetoothctl -a << EOF\n\
power on\n\
connect C4:7C:8D:61:9F:27\n\
exit\n\
EOF\n\
';
var exoff='sudo bluetoothctl -a << EOF\n\
disconect C4:7C:8D:61:9F:27\n\
power off\n\
exit\n\
EOF\n\
';
				var ex = 'ls -l';
				if (sleep) execSync("sleep "+sleep);
				if (state==='on') ex = exon;
				if (state==='off') ex = exoff;
				console.log('ble_on_off ex=',ex);
				var re = execSync(ex).toString().trim();
				console.log('ble_on_off re=',re);
			}
			
			/*-------------*/	
				function readkameraBatt(ex){
					that.status({fill:"red",shape:"ring",text:"Reading battery state"});
					let batt = kamerabattery;
					try {
						let o = execSync(ex).toString().trim();
						console.log('#32 kamera BATT=',o);//#59 bbbbb= Characteristic value/descriptor: 64 10 32 2e 36 2e 32
						if (o){
							let linia = o.split('descriptor: ')[1].trim();
							var wyniki = linia.split(' ');
							batt   = parseInt(wyniki[0],16) || 101;
							context.set('kamerabattery',batt);
							return batt;
						}
					} catch (e) {return batt;}
				} // -- EOF			
			
			
			/*-------------*/	
				function readkameraData(ex){
					that.status({fill:"red",shape:"ring",text:"Reading kamera #"+licznik});
					let obj ={"kamera":false,"success":false};
					try {
						let o = execSync(ex).toString().trim();
						console.log('#50 kamera DATA=',o);

						if (o){
							that.status({fill:"yellow",shape:"ring",text:"Read kamera #"+licznik});
							//o = 'Characteristic value/descriptor: a9 00 00 5a 08 00 00 3e 87 08 00 00 00 00 00 00';
							let linia = o.split('descriptor: ')[1];
							linia = linia.trim();
							//console.log('#15=',linia);
							var wyniki = linia.split(' ');
							for (var a in wyniki) {	wyniki[a] = parseInt(wyniki[a],16);	}
								obj.t   = (wyniki[0] + 256*wyniki[1])/10;
								obj.l   =  wyniki[3] + 256*wyniki[4];
								obj.m   =  wyniki[7];
								obj.c   =  wyniki[8] + 256*wyniki[9];
								obj.kamera = true;
								obj.success = true;
								
							}
						obj.count = licznik++;
						return obj;
					} catch (e) {
						obj.kamera = false;
						obj.success = false;
						return obj;
					}	
				} // -- EOF

/*-----------------------*/
let context = this.context();
let kameracount = context.get('kameracount') || 0;
kameracount += 1;
context.set('kameracount',kameracount);
let kamerabattery = context.get('kamerabattery') || 101;
//context.set('kamerabattery',kamerabattery);


console.log("kameracount,kamerabattery,this.bariera=",kameracount,kamerabattery,this.bariera);
console.log('this.name,this.interval,this.checkrepeat,this.BLEonoff,this.readdata,this.readbatt=');
console.log(this.name,this.interval,this.checkrepeat,this.BLEonoff,this.readdata,this.readbatt);


if (this.BLEonoff === true) ble_on_off('off',2);
if (this.BLEonoff === true) ble_on_off('on',2);

/*-----------------------*/        
				let batt = kamerabattery;
				if (this.readbatt === true) {
					batt = readkameraBatt(exeBatt);
					if (batt === 0)     batt = readkameraBatt(exeBatt);
					if (batt === 0)     batt = readkameraBatt(exeBatt);
				} 
				/*-------------*/
				let ret = readkameraData(exeData);
				if (ret.success === false) ret = readkameraData(exeData);
				if (ret.success === false) ret = readkameraData(exeData);
				if (ret.success === false) ret = readkameraData(exeData);
				ret.batt = batt.batt || 101;
				
				/*-------------*/
				var czas = (new Date()).toLocaleString();
				if (ret.success === false) this.status({fill:"yellow",shape:"ring",text:"Fake: "+czas});
				if (ret.success === true)  this.status({fill:"blue",shape:"dot",text:"Success: "+czas});
				/*-------------*/
if (this.BLEonoff === true) ble_on_off('off',2);				
				//ret = JSON.stringify(ret); // nie musi być txt string
				ret.kameracount = kameracount;
				console.log('#53 ret=',ret);
				msg.payload = ret;
				let msg1={"payload":ret.m};
				node.send([msg,msg1]);

        });
    }
    RED.nodes.registerType("kamera",kameraNode);
}


/*

The shape property can be: ring or dot.

The fill property can be: red, green, yellow, blue or grey

*/
