npm install
del /Q ..\clients\soek\common_lib
del /Q ..\clients\ki_bot\common_lib
mklink /J ..\clients\soek\common_lib common_lib
mklink /J ..\clients\ki_bot\common_lib common_lib
