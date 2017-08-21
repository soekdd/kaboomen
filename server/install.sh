npm install
cd ..
rm clients/soek/common_lib
rm clients/ki_bot/common_lib
ln -s  ../../server/common_lib clients/soek/common_lib
ln -s  ../../server/common_lib clients/ki_bot/common_lib
