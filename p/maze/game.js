/* Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Copyright © 2025, Kenneth Leung. All rights reserved. */

;(function(window,UNDEF){

  "use strict";

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  function scenes(Mojo){
    const int=Math.floor;
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           Game:_G,
           math:_M,
           v2:_V,
           ute:_,is}=Mojo;

    ////////////////////////////////////////////////////////////////////////////
    const AlgoS= window["io/czlab/mcfud/algo/search"]();
    const AlgoM= window["io/czlab/mcfud/algo/maze"]();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const
      UI_FONT=Mojo.DOKI_LOWER,
      SplashCfg= {
        title:"A* Maze",
        clickSnd:"click.mp3",
        action: {name:"PlayGame"}
      };

    ////////////////////////////////////////////////////////////////////////////
    /* */
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("PlayGame",{
      setup(){
        let
          self=this,
          K=Mojo.getScaleFactor();
        _.inject(this.g,{
          initLevel(){
            let verb= Mojo.touchDevice?"Tap":"Click",
              s=_S.bmpText(`${verb} to generate maze`,UI_FONT,36*K);
            function cb(){
              _I.off(["single.tap"],cb);
              _.delay(100,()=>{
                s.text="Please wait...";
                _.delay(100,(m)=>{
                  m=new AlgoM.Maze2(20,20);
                  m.generate();
                  _.delay(100,()=>{
                    _S.remove(s);
                    self.g.showMaze(m);
                  });
                });
              });
            }
            _V.set(s,Mojo.width/2,Mojo.height/2);
            self.insert(_S.centerAnchor(s));
            _I.on(["single.tap"],cb);
          },
          showMaze(m){
            let mmap=m.toGrid(),
              {start,end}= m.getIO(),
              h=mmap.length,
              tb,tw,g,gfx,out={}, w=mmap[0].length;
            g=_S.gridSQ(w,0.68,out);
            gfx=_S.drawGridLines(0,0,g,1,"grey");
            self.insert(gfx);
            self.insert(_S.bboxFrame(out,16*K));
            g.forEach((row,y)=> row.forEach((col,x)=>{
              let skip= (x == start[0] && y == start[1]) || (x == end[0] && y == end[1]);
              let v= mmap[y][x];
              let c=v==1?"black":"white";
              if(skip) {
                c="white";
                v=0;
              }
              if(!tw){
                tw= _S.rectTexture(col.x2-col.x1,col.y2-col.y1, _S.color("white"));
                tb= _S.rectTexture(col.x2-col.x1,col.y2-col.y1, _S.color("black"));
              }
              let s= _S.sprite(c=="white"?tw:tb);
              s.x=col.x1;
              s.y=col.y1;
              self.insert(s);
              col.sprite=s;
              col.value=v;
            }));
            _.inject(_G,{
              arena:out,
              grid:g,
              maze:m
            });
            ////
            _.log(`maze size= [${h},${w}]`);
            _.delay(100,()=> self.g.postShowMaze());
          },
          postShowMaze(){
            let s= _S.bmpText("Solve",UI_FONT, 24*K);
            _S.pinAbove(_G.arena,s, 8*K + s.height);
            s.m5.press=()=>{
              if(s.text=="Solve"){
                self.g.solveMaze()
                s.text= "Regen";
              }else{
                _S.remove(s);
                _.delay(0, ()=>Mojo.Scenes.runEx("PlayGame"));
              }
            };
            self.insert(_I.mkBtn(s));
          },
          solveMaze(){
            console.log(_G.maze.toAscii());
            let g=_.fill(_G.grid.length,()=> []);
            _G.grid.forEach((row,y)=> row.forEach((col,x)=>{
              g[y][x]=col.value
            }));
            const E = _G.maze.entryNodes.start.gate;
            const X = _G.maze.entryNodes.end.gate;
            let ctx={
              wantDiagonal:false,
              compare(a,b){ return a.f-b.f },
              cost(){ return 1 },
              blocked(n){ return g[n[1]][n[0]] != 0 },
              calcHeuristic(a,g){
                return AlgoS.AStarGrid.euclidean(a,g);
              }
            };
            //console.log(JSON.stringify(g))
            let p=new AlgoS.AStarGrid(g).pathTo([E.x,E.y],[X.x,X.y],ctx);
            //console.log(p.length);
            //console.log(JSON.stringify(p))
            let color=_.randItem(_.keys(_S.BtnColors));
            p.forEach(c=>{
              _G.grid[c[1]][c[0]].sprite.tint=_S.BtnColors[color];
            });
          }
        });
        this.g.initLevel();
      },
      postUpdate(dt){
        dt=dt;
      }
    });

    _Z.run("Splash", SplashCfg);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  MojoH5Ldr({
      assetFiles: ["click.mp3"],
      arena: {width:1344,height:840},
      scaleToWindow:"max",
      //scaleFit:"x",
      start(...args){ scenes(...args) } });

})(this);

