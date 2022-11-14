#!/bin/bash 

cd ./p
cwd=`pwd`
echo $cwd
for x in `ls`
do
  cd $x
  #f=`basename "$x" ".mkv"`
  echo "inside " `pwd`
  ##gulp
  rm ./dist/game.js
  cd ..
  #ffmpeg -i $f.mkv -vcodec copy -acodec copy $f.mp4
  #rm $f.mkv
done
