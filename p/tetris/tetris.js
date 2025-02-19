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

  /**/
  function scenes(Mojo){

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //load in game modules
    window["io.czlab.tetris.models"](Mojo);
    window["io.czlab.tetris.logic"](Mojo);

    const int=Math.floor;
    const {Scenes:_Z,
           Sprites:_S,
           FX:_T,
           Input:_I,
           Game:_G,
           v2:_V,
           Ute2D:_U,
           math:_M,
           ute:_, is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const
      UI_FONT=Mojo.DOKI_LOWER,
      SplashCfg= {
        title:"Tetris",
        clickSnd:"click.mp3",
        action: {name:"PlayGame"}
      };


    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const doBackDrop=(s)=> s.insert(_S.fillMax("bg.jpg"));
    const playClick=()=> Mojo.sound("click.mp3").play();
    const CLICK_DELAY=343;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //set up some globals
    _.inject(_G,{
      CELLS:4,
      cur:UNDEF,
      next:UNDEF,
      backDropSprite:UNDEF
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    _Z.scene("PlayGame",{
      postUpdate(dt){
      },
      onPtrDown(){
        if(_G.cur){
          _G.dragMode=true;
          _G.cur.sx=Mojo.mouse.x;
          _G.cur.sy=Mojo.mouse.y; }
      },
      onPtrUp(){
        _G.dragMode=false },
      onPtrMove(){
        if(_G.cur && _G.dragMode){
          let reset,
              dx=Mojo.mouse.x - _G.cur.sx,
              dy=Mojo.mouse.y - _G.cur.sy;
          if(Math.abs(dx)>=_G.tileW){
            _G.shiftHZ(dx>0?1:-1);
            reset=true;
          }
          if(dy>=_G.tileH){
            _G.shiftDown();
            reset=true;
          }
          if(reset){
            _G.cur.sx=Mojo.mouse.x;
            _G.cur.sy=Mojo.mouse.y; }
        }
      },
      onSwipeDown(){ _G.dropDown() },
      postUpdate(){
        if(_G.gameOver){
          _S.die(this);
          _.delay(100, ()=> _Z.modal("EndGame",{
            replay:{name:"PlayGame"},
            quit:{name:"Splash", cfg:SplashCfg},
            msg:"",
            winner:0
          }));
        }else{
          let sx=_G.vbox.x1,
              sy=_G.vbox.y1,
              ex=_G.vbox.x2,
              ey=_G.vbox.y2;
          //show the grid
          _G.gfx.clear();
          for(let i=1;i<_G.rows;++i){
            _G.gfx.moveTo(sx,sy+i*_G.tileH);
            _G.gfx.lineTo(ex,sy+i*_G.tileH);
          }
          for(let i=1;i<_G.cols;++i){
            _G.gfx.moveTo(sx+i*_G.tileW,sy);
            _G.gfx.lineTo(sx+i*_G.tileW,ey);
          }
          _G.gfx.stroke({width:1,color:_S.color("#cccccc"), alpha:0.2});
        }
      },
      dispose(){
        let self=this;
        _G.rightMotion.dispose();
        _G.leftMotion.dispose();
        _G.upMotion.dispose();
        _G.downMotion.dispose();
        _G.dropMotion.dispose();
        if(Mojo.touchDevice){
          _I.off(["touchstart"],"onPtrDown",self);
          _I.off(["touchend"],"onPtrUp",self);
          _I.off(["touchmove"],"onPtrMove",self);
        }else{
          _I.off(["mouseup"],"onPtrUp",self);
          _I.off(["mousedown"],"onPtrDown",self);
          _I.off(["mousemove"],"onPtrMove",self);
        }
        _I.off(["swipe.down"],"onSwipeDown",self);
        _I.off(["single.tap"],"single_tap_cb",self);
      },
      setup(){
        let
          self=this,
          H=Mojo.u.rows,
          W=Mojo.u.cols,
          K=Mojo.getScaleFactor();
        _.inject(this.g,{
          initLevel(){
            let grid=[],
              a= _S.gridXY([W,H],0.8,0.8),
              x1,y1,X=0,Y=Mojo.height, a0=a[0][0];
            _G.tileW=_.evenN(a0.x2-a0.x1);
            _G.tileH=_G.tileW;
            _G.gameOver=false;
            _G.grid=grid;
            _G.score=0;
            _G.rows=H;
            _G.cols=W;
            _G.cur=
            _G.next=UNDEF;
            //make it taller but hide the top 4
            for(let row,y=0;y<(4+H);++y){
              grid.push(row=[]);
              for(let x=0;x<W;++x) row.push(null);
            }
            //center the arena
            H= _G.tileH*_G.rows;
            W=_G.tileW*_G.cols;
            x1=_M.ndiv(Mojo.width-W,2);
            y1=_M.ndiv(Mojo.height-H,2);
            return _G.vbox={x1,x2:x1+W,y1,y2:y1+H};
          },
          initInput(){
            _G.rightMotion= _I.keybd(_I.RIGHT);
            _G.leftMotion= _I.keybd(_I.LEFT);
            _G.upMotion= _I.keybd(_I.UP);
            _G.downMotion= _I.keybd(_I.DOWN);
            _G.dropMotion= _I.keybd(_I.SPACE);
            _G.rightMotion.press=()=> _G.shiftHZ(1);
            _G.leftMotion.press=()=> _G.shiftHZ(-1);
            _G.upMotion.press=()=> _G.rotateCCW();
            _G.downMotion.press=()=> _G.shiftDown();
            _G.dropMotion.press=()=> _G.dropDown();
            if(Mojo.touchDevice){
              _I.on(["touchstart"],"onPtrDown",self);
              _I.on(["touchend"],"onPtrUp",self);
              _I.on(["touchmove"],"onPtrMove",self);
            }else{
              _I.on(["mouseup"],"onPtrUp",self);
              _I.on(["mousedown"],"onPtrDown",self);
              _I.on(["mousemove"],"onPtrMove",self);
            }
            _I.on(["swipe.down"],"onSwipeDown",self);
            return this;
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        _G.gameScene=this;
        this.g.initLevel() && this.g.initInput();
        this.insert(_G.gfx= _S.graphics());
        this.futureX(()=>{ _.shuffle(_G.ModelList) },500);
        this.single_tap_cb=_.debounce(()=>{
          if(Mojo.mouse.x >= _G.vbox.x1 && Mojo.mouse.x <= _G.vbox.x2 &&
             Mojo.mouse.y >= _G.vbox.y1 && Mojo.mouse.y <= _G.vbox.y2 &&
             _G.cur)
            _G.rotateCCW();
        },150);
        _I.on(["single.tap"],"single_tap_cb",this);
        _Z.run("HUD");
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    _Z.scene("HUD",{
      setup(){
        let K=Mojo.getScaleFactor(), LW=30*K;
        Mojo.on(["preview.shape"],"onPreview", this);
        this.insert(_S.rect(Mojo.width,_G.vbox.y1, 0));
        this.insert(_S.bboxFrame(_G.vbox,LW));
        this.insert(this.g.score= _S.bmpText("Score: 0", UI_FONT,48*K));
        let Y = int(Mojo.height/2),
            X = int(_G.vbox.x1/2),
            r= _S.rect(_G.tileW*6,_G.tileH*6,0);
        _V.set(r, X - int(r.width/2), Y - int(r.height/2));
        _G.previewBox=r;
        ////////
        _G.gameScene.insert(_S.bboxFrame({x1:r.x, y1:r.y,
                                          x2:r.x+r.width,y2:r.y+r.height},LW));
        _G.previewNext();
        _.delay(343, ()=> _G.reifyNext() && _G.slowDown());
        _Z.run("AudioIcon",{
          xOffset: -10*K, yOffset:0
        });
      },
      onPreview(s){
        let X = _G.previewBox.x + _G.previewBox.width/2,
            Y = _G.previewBox.y + _G.previewBox.height/2,
            wy= _G.tileH* s.lines[2],
            wx= s.cells[0].length*_G.tileW;
        X = int(X- wx/2);
        Y= int(Y- wy/2);
        s.col=0;
        s.row=0;
        for(let r,k,w=0,y=0;y<s.cells.length;++y){
          r=s.cells[y];
          k=0;
          for(let p,x=0;x<r.length;++x){
            if(r[x]){
              _V.set(r[x],X+(s.col+x)*_G.tileW,
                          Y-((s.row-w)+1)*_G.tileH);
              r[x].visible=true;
              ++k;
            }
          }
          if(k) ++w;
        }
      },
      postUpdate(){
        this.g.score.text=`Score: ${_G.score}`;
      }
    });

    _Z.run("Splash", SplashCfg);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
  MojoH5Ldr({
    assetFiles: ["click.mp3","line.mp3",
                 "tile.png", "bg.jpg", "game_over.mp3"],
    arena: {width: 768, height: 1408},
    scaleToWindow:"max",
    scaleFit:"y",
    cols:12,
    rows:22,
    start(...args){ scenes(...args) }
  });

})(this);


