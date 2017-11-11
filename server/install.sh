rm -r node_modules
rm -r common_lib
mkdir common_lib
npm install
cp -R node_modules/bootstrap/dist/* common_lib/
cp node_modules/jquery/dist/* common_lib/js/
cp node_modules/coffeescript/lib/coffeescript/* common_lib/js/
cp node_modules/less/dist/* common_lib/js/
cp node_modules/angular/*.css common_lib/css/
cp node_modules/angular/*.js common_lib/js/
cp node_modules/angular/*.map common_lib/js/
cp node_modules/socket.io-client/dist/* common_lib/js/
cp node_modules/base64-js/base64js.min.js common_lib/js/
cd node_modules
git clone https://github.com/kolber/audiojs.git
cd ..
cp node_modules/audiojs/audiojs/*.js common_lib/js/
cp node_modules/audiojs/audiojs/*.swf common_lib/js/
cp node_modules/audiojs/audiojs/*.as common_lib/js/
ln -s ../../server_lib/kaboomen_ai.js common_lib/js/kaboomen_ai.js
ln -s ../../server_lib/kaboomen_consts.js common_lib/js/kaboomen_consts.js   
cd ..
rm clients/soek/common_lib
rm clients/anna/common_lib
rm clients/ki_bot/common_lib
ln -s  ../../server/common_lib clients/soek/common_lib
ln -s  ../../server/common_lib clients/anna/common_lib
ln -s  ../../server/common_lib clients/ki_bot/common_lib
