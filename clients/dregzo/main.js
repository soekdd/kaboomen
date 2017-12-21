var rev = 0;
function main () {
    /*global playersetup,pgheight,pgwidth,elsize,mapsetup,goodiesetup*/
    document.getElementById('playground').style.width = (pgwidth*elsize)+'px';
    document.getElementById('playground').style.height = (pgheight*elsize)+'px';
    document.getElementById('goodies').style.width = (pgwidth*elsize)+'px';
    document.getElementById('goodies').style.height = (pgheight*elsize)+'px';
    var playerslist = document.getElementsByClassName('player');
    playersetup();
    mapsetup();
    goodiesetup();
    setInterval(loop,30);
}
    
function loop () {
    playersetup();
    goodiesetup();
}