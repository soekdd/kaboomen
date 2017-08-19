call npm install
del /Q ..\soek\common_lib
del /Q ..\anna\common_lib
del /Q ..\_bot\common_lib
mklink /J ..\soek\common_lib common_lib
mklink /J ..\anna\common_lib common_lib
mklink /J ..\_bot\common_lib common_lib
