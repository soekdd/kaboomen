var dietime = {};

function playersetup(json) {
 /*global rev,elsize*/
 var players = document.getElementsByClassName('player');
 for (var i = 0; i < players.length; i++) {
  var isinjson = false;
  var id = players[i].id;
  for (var key in json.men) {
   if (id == 'player_' + key) {
    isinjson = true;
   }
  }
  if (!isinjson) {
   document.getElementById('players').removeChild(document.getElementById(id));
  }
 }
 var playernames = document.getElementsByClassName('playername');
 for (var i = 0; i < playernames.length; i++) {
  isinjson = false;
  id = playernames[i].id;
  for (var key in json.men) {
   if (id == 'playername_' + key) {
    isinjson = true;
   }
  }
  if (!isinjson) {
   document.getElementById('players').removeChild(document.getElementById(id));
  }
 }

 for (var key in json.men) {
  if (document.getElementById('player_' + key) == null) {
   document.getElementById('players').innerHTML += '<div class="player" id="player_' + key + '"></div>';
   document.getElementById('player_' + key).style.width = elsize + 'px';
   document.getElementById('player_' + key).style.height = elsize + 'px';
  }
  if (document.getElementById('playername_' + key) == null) {
   document.getElementById('players').innerHTML += '<div class="playername" id="playername_' + key + '"></div>';
  }


  document.getElementById('playername_' + key).innerHTML = json.men[key]['name'];
  var playerclass = 'player ';
  var x = json.men[key].x;
  var y = json.men[key].y;
  switch (json.men["" + key]["action"]) {
   case 0:
    dietime[key] = Date.now();
    playerclass += 'player_walk_' + json.men[key].direction + ' player_proc_0';
    break;
   case 5:
    var diff = Date.now() - dietime[key];
    playerclass += 'player_die player_proc_' + (Math.floor(diff / 280));
    break;
   case 6:
    dietime[key] = Date.now();
    playerclass += 'player_walk_' + json.men[key].direction + ' ';
    if (Math.floor(x) != x) {
     playerclass += 'player_proc_' + (Math.floor((x - Math.floor(x)) / 0.125) + 2);
    }
    else if (Math.floor(y) != y) {
     playerclass += 'player_proc_' + (Math.floor((y - Math.floor(y)) / 0.125) + 2);
    }
    else {
     playerclass += 'player_proc_0';
    }
    break;
  }
  var player = document.getElementById('player_' + key);
  var playername = document.getElementById('playername_' + key);
  player.setAttribute("class", playerclass);
  player.style.left = (x * elsize) + 'px';
  player.style.top = (y * elsize) + 'px';
  var middle = playername.style.width / 2;
  playername.style.left = (x * elsize - middle) + 'px';
  playername.style.top = (y * elsize - 20) + 'px';
  rev = json.rev;
 }

}
