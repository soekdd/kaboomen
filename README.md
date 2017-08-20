# kaboomen
Kaboomen is a school project to teach children's web technologies by programming a web client for a massive multiplayer online game. 

## install

### linux

    install.sh

### windows

    install.bat
    
## usage of game server

### start server

    node server.js
    

It's recommend to use pm2. Check the server/pm2.config.js.example. 

### configure

Either config via config.ini or via environment setting (PM2 conform).

    export PORT=8088
    # PORT defines the http port, the https port is PORT-1000
    export LEVEL=classic
    # LEVEL defines the level which will be loaded
    export INIFILE
    # INIFILE defines an alternative ini file

## API

Kaboomen server supports three levels of APIs. It is recommended to adjust 
the difficulty of the APIs to the age of the students.

|API|recommend student's age|address and usage|supported features|
|---|---|---|---|
|simple|below 14y old|**http(s)://server:port** or <br>**http(s)://server:port/simple**   |moving players field by field (chess like)|
|standard|15y - 16y old|**http(s)://server:port/standard/[revNum]** <br>..sending last revision number to avoid double updates|animation support, <br>pixel-wise movement of players,<br> additional information about players and bombs,<br>sound available|
|extended|older than 16y old|**http(s)://server:port/extended/[revNum]** <br>...sending last revision number to avoid double updates<br>**http(s)://server:port/map**<br>...getting static map|different background support,<br>map is not part of updates anymore|

### simple API

The simple API consists of the map only. Each cell can show one object. The meaning of 
the values is explained in the common_lib/js/kaboomen_consts.js. This file is used by server
and clients simultanly. 

Map elements and filters: 

|value dec|value hex|meaning|kaboomenconstsjs name|
|---------|---------|-------|-----------------------|
|value dec|value hex|meaning|kaboomenconstsjs name|


|0        |0x00     |floor  |MAP_FLOOR|
|1        |0x01     |wall   |MAP_WALL|
|3        |0x03     |bomb   |ITEM_BOMB|
|16..31   |0x010..  |goodies plus goodie-id|FILTER_GOODIE|
|32..63   |0x020..  |explosion plus it's part|FILTER_BOMBS|
|64..67   |0x40     |box plus life left|FILTER_BOX|
|256..    |0x100..  |player plus it's id|FILTER_PLAYER|

Goodies:

|value additional to it's filter|meaning|kaboomen_consts.js name|
|-------------------------------|-------|-----------------------|
|1|good goodie: increase bombs radius|GOODIE_MORE_EXPL|
|2|bad goodie: decrease bombs radius|GOODIE_LESS_EXPL|
|3|good goodie: increase number of bombs|GOODIE_MORE_BOMB|
|4|bad goodie: decrease number of bombs|GOODIE_LESS_BOMB|
|5|good goodie: increase speed of player|GOODIE_MORE_SPEED|
|6|bad goodie: decrease speed of player|GOODIE_LESS_SPEED|
|7|special goodie: player will be indestructible|GOODIE_INDESTRUCTIBLE|
|8|special goodie: player will get stronger bombs|GOODIE_STRONGBOMB|
|9|special goodie: player will get remote bombs|GOODIE_REMOTEBOMB|

Explosions:

|value additional to it's filter|part of explosion|kaboomen_consts.js name|
|-------------------------------|-------|-----------------------|
|1|center|MAP_BOMB_CENTER|
|2|horizontal|MAP_BOMB_HORI|
|3|vertical|MAP_BOMB_VERT|
|4|end of left|MAP_BOMB_ENDL|
|5|end of right|MAP_BOMB_ENDR|
|6|end of top|MAP_BOMB_ENDT|
|7|end of bottom|MAP_BOMB_ENDT|

Example:

    [[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
     [1,65,65,66,65,65,0,0,66,65,66,0,0,65,66,0,66,65,65,65,65,65,65,66,66,66,65,65,1],
     [1,66,1,66,1,65,1,0,1,0,1,66,1,0,1,0,1,65,1,65,1,66,1,65,1,65,1,65,1],
     [1,65,66,67,0,0,0,0,0,0,0,0,0,65,0,0,0,66,0,66,65,65,65,65,65,65,65,65,1],
     [1,66,1,65,1,65,1,0,1,0,1,0,1,0,1,67,1,0,1,0,1,65,1,65,1,65,1,66,1],
     [1,66,65,0,0,0,0,0,0,0,66,0,66,0,0,0,0,0,19,0,0,0,0,65,66,65,66,65,1],
     [1,25,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,21,1,0,1,65,1,65,1,65,1,66,1],
     [1,23,0,66,25,0,0,0,0,0,0,0,66,0,66,0,66,65,0,0,0,0,0,0,66,65,65,65,1],
     [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,65,1,0,1,0,1,0,1,65,1,65,1,65,1],
     [1,65,65,65,66,0,0,0,0,0,0,0,0,67,65,3,66,65,0,65,0,66,65,67,65,65,66,66,1],
     [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,66,1,66,1,66,1,65,1,65,1,65,1],
     [1,0,0,65,66,67,66,0,0,67,0,65,0,257,0,0,66,65,0,0,67,65,67,65,67,65,65,65,1],
     [1,65,1,65,1,0,1,0,1,0,1,0,1,66,1,0,1,65,1,66,1,66,1,67,1,65,1,66,1],
     [1,66,0,65,65,0,0,0,0,0,0,0,66,66,65,65,65,65,65,65,65,65,65,65,66,67,65,66,1],
     [1,66,1,65,1,0,1,0,1,66,1,0,1,65,1,0,1,65,1,67,1,65,1,65,1,65,1,65,1],
     [1,66,65,65,66,0,25,0,65,65,65,0,66,67,65,65,0,0,0,0,65,65,65,65,66,65,65,65,1],
     [1,65,1,65,1,25,1,65,1,65,1,66,1,0,1,66,1,0,1,65,1,65,1,65,1,65,1,65,1],
     [1,65,66,66,65,65,65,65,65,65,65,66,0,66,65,65,65,65,65,65,66,65,67,66,65,65,66,66,1],
     [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ]

### standard API
The standard API consists of the simple API in the 'map' element and additional information
about the player (men), bombs and sounds.

Within the standard API the concept of revisions is added. By calling the webservice,
the current 'rev' number is sent. To avoid double updates, add the last rev to the next 
webservice. Is the server revision changed, you will get a normal update. Is the server revision
unchanged, the response will be empty. This avoids useless web traffic.

Example:

    {"map":[[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,65,65,66,65,65,0,0,66,65,66,0,0,65,66,0,66,65,65,65,65,65,65,66,66,66,65,65,1],
            [1,66,1,66,1,65,1,0,1,0,1,66,1,0,1,0,1,65,1,65,1,66,1,65,1,65,1,65,1],
            [1,65,66,67,0,0,0,0,0,0,0,0,0,65,0,0,0,66,0,66,65,65,65,65,65,65,65,65,1],
            [1,66,1,65,1,65,1,0,1,0,1,0,1,0,1,67,1,0,1,0,1,65,1,65,1,65,1,66,1],
            [1,66,65,0,0,0,0,0,0,0,66,0,66,0,0,0,0,0,19,0,0,0,0,65,66,65,66,65,1],
            [1,25,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,21,1,0,1,65,1,65,1,65,1,66,1],
            [1,23,0,66,25,0,0,0,0,0,0,0,66,0,66,0,66,65,0,0,0,0,0,0,66,65,65,65,1],
            [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,65,1,0,1,0,1,0,1,65,1,65,1,65,1],
            [1,65,65,65,66,0,0,0,0,0,0,0,0,67,65,0,66,65,0,65,0,66,65,67,65,65,66,66,1],
            [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,66,1,66,1,66,1,65,1,65,1,65,1],
            [1,0,0,65,66,67,66,0,0,67,0,0,0,0,0,257,66,65,0,0,67,65,67,65,67,65,65,65,1],
            [1,65,1,65,1,0,1,0,1,0,1,0,1,66,1,0,1,65,1,66,1,66,1,67,1,65,1,66,1],
            [1,66,0,65,65,0,0,0,0,0,0,0,66,66,65,65,65,65,65,65,65,65,65,65,66,67,65,66,1],
            [1,66,1,65,1,0,1,0,1,66,1,0,1,65,1,0,1,65,1,67,1,65,1,65,1,65,1,65,1],
            [1,66,65,65,66,0,25,0,65,65,65,0,66,67,65,65,0,0,0,0,65,65,65,65,66,65,65,65,1],
            [1,65,1,65,1,25,1,65,1,65,1,66,1,0,1,66,1,0,1,65,1,65,1,65,1,65,1,65,1],
            [1,65,66,66,65,65,65,65,65,65,65,66,0,66,65,65,65,65,65,65,66,65,67,66,65,65,66,66,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]],
     "men":{"1":{"name":"NodeBot","speed":2,"anim":6,"look":1,"bombs":9,"score":0,"next":0,
                 "action":6,"direction":4,"id":1,"indest":0,"hasSBomb":0,"hasRBomb":0,
                 "bombRadius":5,"countDown":3,"x":14.75,"y":11}},
     "sounds":{"11802":{"timestamp":1503239937976,"sound":"tick"},
               "11803":{"timestamp":1503239938477,"sound":"tick"},
               "11804":{"timestamp":1503239938975,"sound":"expl","bomberId":-1},
               "11805":{"timestamp":1503239939076,"sound":"expl","bomberId":-1},
               "11806":{"timestamp":1503239939175,"sound":"expl","bomberId":-1},
               "11807":{"timestamp":1503239939275,"sound":"expl","bomberId":-1},
               "11808":{"timestamp":1503239939567,"sound":"good","bomberId":1}},
     "bombs":{"2":null,"3":null},
     "width":29,
     "height":19,
     "rev":328397,"stime":1503239941619
    }
    
### extended API 
The expended API splits the static parts of the map and the dynamic parts. Therefor the static
map is provided by an additional webservice '/map/'. The game update is equal the the
standard API but added by the boxes value. Two cells share one hex value. 

|0|1|2|3|
|-|-|-|-|
|low bit cell #1|high bit cell #1|low bit cell #2|high bit cell #2|

Boxes in cells can have 1 to 3 lifes. 0 means no box. Therefor the box values are between 0..3. 
So they need 2 bits per cell only. Two cells combined means 4 bits, which causes hex values between
0...f. All combined cells in a row are stored in a string. Each row gets it's own string. 
It is a very simple kind of compression.


Example (game update):

    {"boxes":["000000000000000","056189098555a61","022100200112111","093000010265551",
              "021100003001112","060008800000991","000000000001112","002000888100851",
              "000000001000111","059000078116792","000000000222111","009b030081cdd51",
              "011000020122312","025000865555972","021002010131111","069045871045951",
              "011011202011111","09655526559d692","000000000000000"],
     "men":{"1":{"name":"NodeBot","speed":2,"anim":0,"look":1,"bombs":9,"score":0,"next":0,
                 "action":0,"direction":3,"id":1,"indest":0,"hasSBomb":0,"hasRBomb":0,
                 "bombRadius":5,"countDown":3,"x":10,"y":11}},
     "sounds":{"11802":{"timestamp":1503239937976,"sound":"tick"},
               "11803":{"timestamp":1503239938477,"sound":"tick"},
               "11804":{"timestamp":1503239938975,"sound":"expl","bomberId":-1},
               "11805":{"timestamp":1503239939076,"sound":"expl","bomberId":-1},
               "11806":{"timestamp":1503239939175,"sound":"expl","bomberId":-1},
               "11807":{"timestamp":1503239939275,"sound":"expl","bomberId":-1},
               "11808":{"timestamp":1503239939567,"sound":"good","bomberId":1}},
     "bombs":{"2":null,"3":null},
     "goodies":[{"x":18,"y":5,"g":3},{"x":1,"y":6,"g":9},{"x":17,"y":6,"g":5},
                {"x":1,"y":7,"g":7},{"x":4,"y":7,"g":9},{"x":6,"y":15,"g":9},
                {"x":5,"y":16,"g":9}],
     "width":29,
     "height":19,
     "rev":328288,"stime":1503239939755
    }
    
The static map reserved space in the cell values to store the box life in the first two bits of a cell. 
Therefor the first two bits are unused. 

Bits of static map value

|0..1|2..7|8|
|----|----|-|
|reserved for boxes|value of cell type|wall(1) or floor(0)|

The static map only needs to be called once.

Example (static map)

    {"map":[
     [528,516,516,516,516,516,516,516,516,516,516,516,516,516,516,516,516,516,516,516,516,516,516,516,516,516,516,516,536],
     [520,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,520],
     [520,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,520],
     [520,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,520],
     [520,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,520],
     [520,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,520],
     [520,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,520],
     [520,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,520],
     [520,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,520],
     [520,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,520],
     [520,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,520],
     [520,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,520],
     [520,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,520],
     [520,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,520],
     [520,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,520],
     [520,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,520],
     [520,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,512,16,520],
     [520,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,16,8,520],
     [532,516,516,516,516,516,516,516,516,516,516,516,516,516,516,516,516,516,516,516,516,516,516,516,516,516,516,516,524]
    ],"width":29,"height":19}

## usage of server based AI bot

### start AI bot

    node bot.js

### configure

Either config via config.ini or via ENV setting (PM2 conform).

    export PORT=8088
    # PORT defines the http the bot tries to achieve the server
    export NAME=myBot
    # defines the name of the bot shown in the game for the other players
