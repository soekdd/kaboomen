del /S /Q node_modules
del /S /Q common_lib
mkdir common_lib
call npm install
xcopy /S /Y node_modules\bootstrap\dist\* common_lib\
xcopy /Y node_modules/Jquery\dist\* common_lib\js\
xcopy /Y node_modules\coffeescript\lib\coffeescript\* common_lib\js\
xcopy /Y node_modules\less\dist\* common_lib\js\
xcopy /Y node_modules\angular\*.css common_lib\css\
xcopy /Y node_modules\angular\*.js common_lib\js\
xcopy /Y node_modules\angular\*.map common_lib\js\
xcopy /Y node_modules\socket.io-client\dist\* common_lib\js\
xcopy /Y node_modules\base64-js\base64js.min.js common_lib\js\
cd node_modules
git clone https://github.com/kolber/audiojs.git
cd ..
xcopy /Y node_modules\audiojs\audiojs\*.js common_lib\js\
xcopy /Y node_modules\audiojs\audiojs\*.swf common_lib\js\
xcopy /Y node_modules\audiojs\audiojs\*.as common_lib\js\
mklink common_lib\js\kaboomen_ai.js ..\..\server_lib\kaboomen_ai.js 
mklink common_lib\js\kaboomen_consts.js ..\..\server_lib\kaboomen_consts.js 
cd ..
del /Q clients\soek\common_lib
del /Q clients\anna\common_lib
del /Q clients\ki_bot\common_lib
mklink /J clients\anna\common_lib server\common_lib
mklink /J clients\soek\common_lib server\common_lib
mklink /J clients\ki_bot\common_lib server\common_lib