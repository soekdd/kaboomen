/*global $, c, getExtendedClassOfTile*/
let lastRev = 0;
let playerId = "";
let authId = "";
//-------------------------------------------------------------------------------------------------------------
function main(){	//called one time
	let s = '';
	let box_w = Math.floor(  $(document).width() * 0.8 / c.SET_WIDTH  );
	if(box_w*c.SET_HEIGHT > 0.9 * $(document).height()){box_w = Math.floor(  $(document).height() * 0.9 / c.SET_HEIGHT  );}
	
	setBoxWidthAll(box_w);		//sets .all_div{width; height} .spielfeld{width; height}
	
    for(let zeile=0; zeile<c.SET_HEIGHT; zeile++){
		for(let spalte=0; spalte<c.SET_WIDTH; spalte++){
			//layers:	BACKGROUND | WALL | FLOOR | BOX | GOODIE
			
			s += '<div class="mapDiv BACKGROUND" ';					//create BACKGROUND divs
			s += 'id="BACKGROUND_'+zeile+'_'+spalte+'" ';
			s += 'style="top:'+(box_w*zeile)+'px; ';
			s += 'left:'+(box_w*spalte)+'px;';
			s += '"></div>';
			
			s += '<div class="mapDiv" ';						//create WALL divs
			s += 'id="WALL_'+zeile+'_'+spalte+'" ';
			s += 'style="top:'+(box_w*zeile)+'px; ';
			s += 'left:'+(box_w*spalte)+'px;';
			s += '"></div>';
			
			s += '<div class="mapDiv" ';						//create FLOOR divs
			s += 'id="FLOOR_'+zeile+'_'+spalte+'" ';
			s += 'style="top:'+(box_w*zeile)+'px; ';
			s += 'left:'+(box_w*spalte)+'px;';
			s += '"></div>';
			
			s += '<div class="mapDiv" ';						//create BOX divs
			s += 'id="BOX_'+zeile+'_'+spalte+'" ';
			s += 'style="top:'+(box_w*zeile)+'px; ';
			s += 'left:'+(box_w*spalte)+'px;';
			s += '"></div>';
			
			s += '<div class="mapDiv" ';						//create GOODIE divs
			s += 'id="GOODIE_'+zeile+'_'+spalte+'" ';
			s += 'style="top:'+(box_w*zeile)+'px; ';
			s += 'left:'+(box_w*spalte)+'px;';
			s += '"></div>';
			
			s += '</br>';
		}
	}
	document.getElementById('spielfeld').innerHTML = s;
	
	$.getJSON('http://kaboomen.com:8082/map/', function(static_map){		//apply WALLs and FLOORs from static map
		for(let zeile=0; zeile<c.SET_HEIGHT; zeile++){
			for(let spalte=0; spalte<c.SET_WIDTH; spalte++){
				let tileInfo = getExtendedClassOfTile(static_map.map[zeile][spalte]);
				if(tileInfo.type == "FLOOR"){
					document.getElementById('FLOOR_'+zeile+'_'+spalte).setAttribute("class", 'mapDiv '+tileInfo.class);
				}
				if(tileInfo.type == "WALL"){
					document.getElementById('WALL_'+zeile+'_'+spalte).setAttribute("class", 'mapDiv '+tileInfo.class);
				}
			}
		}
	});
	
	refresh();
	setInterval(refresh, 100);
}
//-------------------------------------------------------------------------------------------------------------
function refresh(){
	$.getJSON('http://kaboomen.com:8082/extended/'+lastRev, received);
}
//-------------------------------------------------------------------------------------------------------------
function received(spielinfo){
	if(spielinfo.rev < lastRev){ console.log("old callback was shut"); return; }	//älter als das letzte bekommene
	if(playerId in spielinfo.men){
		//console.log("vorhanden");
		document.getElementById('login').style.display = 'none';
	}
	else{
		//console.log("nicht vorhanden");
		if(playerId!=="" && authId!==""){
			playerId, authId = "";
			console.log("logged out");
			document.getElementById('login').style.display = 'initial';
		}
	}
	
	/*
	BOXEN
	Ein String ist eine Zeile .. immer zwei Kisten in einem char
	parseInt("fa23423c23lala", 16);
	entweder einfach filter 0x03 .. oder vorher noch >> 2
		dann = Leben
	*/
	spielinfo['boxes'].forEach(function(boxRow, row){
		
	});
	
	/*
	lastRev = spielinfo.rev;
	for(let zeile=0; zeile<c.SET_HEIGHT; zeile++){
		for(let spalte=0; spalte<c.SET_WIDTH; spalte++){
			let fieldValue = spielinfo.map[zeile][spalte];
    		let divClass = 'all_div '+getDivClass(fieldValue);
			document.getElementById(zeile+'_'+spalte).setAttribute("class", divClass);
		}
	}
	*/
}
//-------------------------------------------------------------------------------------------------------------
/*function getDivClass(f_value){
	switch(f_value){
		case 1:
			return "wall";
		default:
			return "";
	}
}*/
//-------------------------------------------------------------------------------------------------------------
function setBoxWidthAll(box_w){
	let css = '.mapDiv{width: '+box_w+'px; height: '+box_w+'px;}';				//overwrites old attributes
	
	let spielfeld_w = box_w * c.SET_WIDTH;
	let spielfeld_h = box_w * c.SET_HEIGHT;
	css += '#spielfeld{width: '+spielfeld_w+'px; height: '+spielfeld_h+'px;}';
	
	let styleElement = document.createElement('style');
	styleElement.appendChild( document.createTextNode(css) );
	document.head.appendChild(styleElement);
}
//-------------------------------------------------------------------------------------------------------------
function login(){
	//console.log("login called");
	let nick = document.getElementById('login_input').value;
	if(!nick || nick===""){ return; }
	$.get({url: "http://kaboomen.de:8082/create/"+nick, success: function(data){
		if(data && data!=""){
			[authId, playerId] = data.split(',');
			let s = "Logged in with:";
				s += "\n\tName: "+nick;	
				s += "\n\tplayerId: "+playerId;
				s += "\n\tauthId: "+authId;
			console.log(s);
		}
	}});
}
//-------------------------------------------------------------------------------------------------------------
$(document).ready(main);