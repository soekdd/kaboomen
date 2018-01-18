function mapsetup () {
    /*global $,pgwidth,pgheight*/
    document.getElementById('map').style.width = (elsize*pgwidth)+'px';
    document.getElementById('map').style.height = (elsize*pgheight)+'px';
    $.getJSON('http://kaboomen.de:8081/map',mapreceived);
}

function mapreceived (json) {
    /*global pgheight,pgwidth,elsize*/
    var map = '';
    for (var i=0;i<pgheight;i++) {
        //map += '<div class="floorline">';
        for (var j=0;j<pgwidth;j++) {
            map += '<div id = "floor_'+i+'_'+j+'" class="'+encode(json.map[i][j])+'"></div>';
        }
        //map += '</div>';
    }
    document.getElementById('map').innerHTML = map;
    for (var i = 0; i < pgheight; i++) {
        for (var j = 0; j < pgwidth; j++) {
            document.getElementById('floor_'+i+'_'+j).style.top = (i*elsize)+'px';
            document.getElementById('floor_'+i+'_'+j).style.left = (j*elsize)+'px';
            document.getElementById('floor_'+i+'_'+j).style.width = elsize+'px';
            document.getElementById('floor_'+i+'_'+j).style.height = elsize+'px';
        }
    }
}

function encode (jsonid) {
    switch (jsonid) {
        case 8:
            //return 'wall empty';
            return 'tile tile01';
        case 16:
            //return 'wall empty';
            return 'tile tile01';
        case 512:
            return 'wall wall1111';
        case 516:
            return 'wall wall1010';
        case 520:
            return 'wall wall0101';
        case 524:
            return 'wall wall0110';
        case 528:
            return 'wall wall1001';
        case 532:
            return 'wall wall0011';
        case 536:
            return 'wall wall1100';
        default:
            return 'wall tile01';
    }
}