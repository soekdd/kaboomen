var rev = 0;
function main () {
    /*global playersetup,pgheight,pgwidth,elsize,mapsetup,goodiesetup,boxsetup,bombsetup*/
    document.getElementById('playground').style.width = (pgwidth*elsize)+'px';
    document.getElementById('playground').style.height = (pgheight*elsize)+'px';
    document.getElementById('goodies').style.width = (pgwidth*elsize)+'px';
    document.getElementById('goodies').style.height = (pgheight*elsize)+'px';
    var playerslist = document.getElementsByClassName('player');
    mapsetup();
    loop()
    setInterval(loop,30);
}
    
function loop () {
    /*global $*/
    $.getJSON('http://kaboomen.de:8081/extended/'+rev,jsonloaded);
}

function jsonloaded(json) {
    playersetup(json);
    goodiesetup(json);
    boxsetup(json);
    bombsetup(json);
    rev = json.rev;
}

