/*globals c, $*/
let active = 1;
let ground;
let filename = null;

function getFiles(element) {
    $.getJSON('getAllLevels.php', function(fileList) {
        let s = '';
        fileList.forEach(function(val) {
            s += '<option value=' + val + '>' + val + '</option>';
        });
        $(element).html(s);
        if (fileList.indexOf(filename)==-1) {
            filename = fileList[0];
        }
        getLevel(filename);
    });
}

function setActive(newActive) {
    if (newActive!=active) {
        active = newActive;
        createPalette();
    }
}

function createPalette(){
    ['wall','ground'].forEach(function(tile) {
        let s = '';
        for(let i=1;i<17;i++) {
            let j = i + (tile=='wall'?c.EXTMAP_WALL_GROUND:0);
            s = s + '<div onclick="setActive('+(j-1)+')" style="top:' + (((i-1) % 8) * 40) + 'px;left:'+(i>8?'4':'')+'0px;" class="tile ' + tile +  (j==(active+1)?' ':' in') + 'active bV' + i + '" id="palette' + tile + '_' + i + '"></div>';
        }
        document.getElementById(tile).innerHTML=s;
    });
}

function paintMap(){
        let height = ground.height;
        let width = ground.width;
        let s = '';
        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                let tile = 'wall';
                if (ground.map[i][j] < c.EXTMAP_WALL_GROUND) tile = 'ground';
                let tileVersion = ((ground.map[i][j] & c.EXTMAP_FILTER_TILETYPE) >> 2) + 1;
                s = s + '<div onclick="changeCell(' + j + ',' + i + ')" style="top:' + (i * 33) + 'px;left:' + (j * 33) + 'px;" class="tile ' + tile + ' bV' + tileVersion + '" id="cell' + i + '_' + j + '"></div>';
            }
        }
        let game = document.getElementById('game');
        game.innerHTML = s;
        game.style.width = 33 * width + 'px';
        game.style.height = 33 * height + 'px';

}

function changeCell(x,y) {
    ground.map[y][x]=active<<2;
    paintMap();
}

function getLevel(inFilename) {
    filename = inFilename;
    $.getJSON('getLevel.php?level=' + filename, function(inGround) {
        ground = inGround;
        paintMap();
        setFormular();
    });
}

function setFormular() {
    $('#width').val(ground.width);
    $('#height').val(ground.height);
    $('#title').val(ground.title);
    $('#active').prop('checked', ground.active);
    $('#filename').val(filename);
}

function getFormular() {
    ground.width = $('#width').val();
    ground.height = $('#height').val();
    ground.title = $('#title').val();
    ground.active = $('#active').prop('checked');
    filename = $('#filename').val();
    $("#levelList").filter(function() {
        return $(this).text() == filename; 
    }).prop('selected', true);
    setFormular();
    paintMap();
}

function load(){
    getLevel($("#levelList").val());
}

function save(){
     $.ajax({
        type:"GET",
        cache:false,
        url:"storeLevel.php",
        data:"level="+filename+'&content='+JSON.stringify(ground),
        success: function (html) {
            alert(filename+' successfully stored!');
            getFiles('#levelList');
        }
      });
}


function main() {
    createPalette();
    getFiles('#levelList');
}

$(document).ready(main);
