/*global $, c*/
let lastRev = 0;
//-------------------------------------------------------------------------------------------------------------
function main(){	//called one time
	let s = '';
	let box_w = Math.floor(  $(document).width() * 0.8 / c.SET_WIDTH  );
	
	setBoxWidthAll(box_w);		//sets .all_div{width; height} .spielfeld{width; height}
	
    for(let zeile=0; zeile<c.SET_HEIGHT; zeile++){
		for(let spalte=0; spalte<c.SET_WIDTH; spalte++){
			s += '<div class="all_div static_bg" ';			//static bg (without id)
			s += 'style="top: '+(box_w*zeile)+'px; ';
			s += 'left:'+(box_w*spalte)+'px;"></div>';
			
			s += '<div class="all_div " ';					//
			s += 'id="'+zeile+'_'+spalte+'" ';				//
			s += 'style="top:'+(box_w*zeile)+'px; ';		//	all walls ? not making sense here!
			s += 'left:'+(box_w*spalte)+'px;';				//	task: please save global the divs and remove if they're away
			s += '"></div>';								//
		}
	}
	document.getElementById('spielfeld').innerHTML = s;
	refresh();
	setInterval(refresh, 100);
}
//-------------------------------------------------------------------------------------------------------------
function refresh(){
	$.getJSON('http://kaboomen.com:8082/standard/'+lastRev, received);
}
//-------------------------------------------------------------------------------------------------------------
function received(spielinfo){
	lastRev = spielinfo.rev;
	for(let zeile=0; zeile<c.SET_HEIGHT; zeile++){
		for(let spalte=0; spalte<c.SET_WIDTH; spalte++){
			let fieldValue = spielinfo.map[zeile][spalte];
    		let divClass = 'all_div '+getDivClass(fieldValue);
			document.getElementById(zeile+'_'+spalte).setAttribute("class", divClass);
		}
	}
}
//-------------------------------------------------------------------------------------------------------------
function getDivClass(f_value){
	switch(f_value){
		case 1:
			return "wall";
		default:
			return "";
	}
}
//-------------------------------------------------------------------------------------------------------------
function setBoxWidthAll(box_w){
	let css = '.all_div{width: '+box_w+'px; height: '+box_w+'px;}';				//overwrites old attributes
	
	let spielfeld_w = box_w * c.SET_WIDTH;
	let spielfeld_h = box_w * c.SET_HEIGHT;
	css += '#spielfeld{width: '+spielfeld_w+'px; height: '+spielfeld_h+'px;}';
	
	let styleElement = document.createElement('style');
	styleElement.appendChild( document.createTextNode(css) );
	document.head.appendChild(styleElement);
}
//-------------------------------------------------------------------------------------------------------------
$(document).ready(main);