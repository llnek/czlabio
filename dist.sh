#!/bin/bash 

cd ./p
cwd=`pwd`
echo $cwd
for x in `ls`
do
  if [ "$x" != "node_modules" ]; then
    if [ -d "$x" ]; then
      cd $x
      echo "inside " `pwd`
      gulp
      #rm ./lib ./vendor
      rm ./dist/game.js
      cd ..
    fi
  fi
done
