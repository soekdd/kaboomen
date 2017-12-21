function goodiesetup () {
    /* global $,rev*/
    $.getJSON('http://kaboomen.de:8081/extended/'+rev,goodiesloaded);
}

function goodiesloaded (json) {
    /*global elsize*/
    var goodies = document.getElementsByClassName('goodie');
    for (var i = 0; i < goodies.length; i++) {
        var isinjson = false;
        var id = goodies[i].id;
        for (var j = 0; j < json.goodies.length; j++) {
            if (id == 'goodie_'+json.goodies[j].x+'_'+json.goodies[j].y+'_'+json.goodies[j].g) {
                isinjson = true;
            }
        }
        if (!isinjson) {
            document.getElementById('goodies').removeChild(document.getElementById(id));
        }
    }
    
    for (var i = 0; i < json.goodies.length; i++) {
        var id = 'goodie_'+json.goodies[i].x+'_'+json.goodies[i].y+'_'+json.goodies[i].g;
        if (document.getElementById(id) == null) {
            document.getElementById('goodies').innerHTML += '<div class="goodie goodie_'+json.goodies[i].g+'" id="'+id+'"></div>';
            document.getElementById(id).style.width = elsize+'px';
            document.getElementById(id).style.height = elsize+'px';
            document.getElementById(id).style.left = (elsize*json.goodies[i].x)+'px';
            document.getElementById(id).style.top = (elsize*json.goodies[i].y)+'px';
        }
    }
    rev = json.rev;
}