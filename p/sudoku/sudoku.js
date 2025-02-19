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

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    window["io/czlab/sudoku/model"](Mojo);

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const {Sprites:_S,
           Scenes:_Z,
           Input:_I,
           Game:_G,
           Ute2D:_U,
           FX:_F,
           v2:_V,
           math:_M,
           ute:_,is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const int=Math.floor, ceil=Math.ceil, abs=Math.abs;
    const sin=Math.sin, cos=Math.cos;
    const CLICK_DELAY=343;
    const C_ORANGE=_S.color("#f4d52b");

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const
      UI_FONT=Mojo.DOKI_LOWER,
      SplashCfg= {
        title:"Sudoku",
        clickSnd:"click.mp3",
        action: {name:"MainMenu"}
      };


    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const doBackDrop=(s)=> s.insert(_S.opacity(_S.fillMax("bg.jpg"),1));
    const playClick=()=> Mojo.sound("click.mp3").play();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    _.inject(_G,{
      DIM:9,
      D3:3,
      DIMCNT:81,
      NUMS: "123456789".split(/(\d{1})/).filter(s=>s.length)
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    _.inject(_G,{
      NUMINTS: _G.NUMS.map(n=> +n),
      NUMSTR: _G.NUMS.join("")
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    const FONTCFG={fontName:UI_FONT,fontSize:196*Mojo.getScaleFactor(),fill:_S.color("black")};

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    function initCache(w,h,cache){
      const
        cfg= FONTCFG,
        K=Mojo.getScaleFactor();
      _G.NUMS.forEach(n=>{
        let out=[],z=_G.NUMS.length+1;
        for(let c,s,i=0;i<z;++i){
          s=_S.centerAnchor(_S.sprite("cell.png"));
          c=_S.centerAnchor(_S.bmpText(n,cfg));
          s.addChild(c);
          out.push(_S.sizeXY(s,w,h));
        }
        cache[+n]=out;
      });
      return cache;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    function deselect(){
      if(_G.curMarked){
        _G.curMarked.g.marked=false;
        whichColor(_G.curMarked);
        _G.curMarked=UNDEF;
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    function select(s){
      if(_G.curMarked!==s){
        _G.curMarked=s;
        s.g.marked=true;
        s.tint=_S.color("black");//"#d2f22e"
      }
      return s;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    function erase(){
      let s= _G.curMarked;
      if(s && s.g.value !=0){
        _G.prevAction=new Deletion(s);
        delNum(s);
        s.g.value=0;
        _G.sudoku[s.g.row][s.g.col]=0;
        idleColor(s);
        _G.curMarked=UNDEF;
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    function idleColor(s){
      s.g.value=0;
      return whichColor(s);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    function assign(v){
      let s=_G.curMarked;
      if(s){
        if(!_G.Sudoku.validateCell(_G.sudoku,s.g.row,s.g.col,v)){
          Mojo.sound("error.mp3").play();
          s=UNDEF;
        }
      }
      if(s){
        _G.prevAction=new Assignment(s,v);
        s.g.marked=false;
        s.g.value=v;
        addNum(s,v);
        whichColor(s);
        _G.sudoku[s.g.row][s.g.col]=v;
        _G.curMarked=UNDEF;
        Mojo.sound("click.mp3").play();
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    function whichColor(s){
      if(s.g.value != 0){
        s.tint=_S.color("#f1ad2e");
      }else{
        s.tint=_S.color("#e6e83b");
      }
      return s;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    function addNum(s,v){
      s.removeChildren();
      s.addChild(_S.anchorXY(_S.bmpText(""+v,FONTCFG),0.5));
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    const delNum=(s)=> s.removeChildren();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    function undoMarked(s){
      s.g.marked=false;
      if(_G.curMarked){
        _G.curMarked.g.marked=false;
        _G.curMarked=UNDEF;
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    class Action{
      constructor(){ }
      postUndo(s){
        _G.sudoku[s.g.row][s.g.col]=this.prevValue;
        if(this.prevValue==0)
          delNum(s);
        else
          addNum(s,this.prevValue);
        undoMarked(s);
        whichColor(s);
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    class Assignment extends Action{
      constructor(s,v){
        super();
        this.cell=s;
        this.prevValue=s.g.value;
      }
      undo(){
        this.cell.g.value=this.prevValue;
        this.postUndo(this.cell);
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    class Deletion extends Action{
      constructor(s){
        super()
        this.cell=s;
        this.prevValue=s.g.value;
      }
      undo(){
        this.cell.g.value=this.prevValue;
        this.postUndo(this.cell);
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    _Z.scene("MainMenu",{
      setup(){
        const
          self=this,
          K=Mojo.getScaleFactor();
        _.inject(this.g,{
          doChoices(){
            let cfg={fontSize:48*K,fontName:UI_FONT},
              space=()=> _S.opacity(_S.bmpText("I", cfg),0),
              b1=_I.mkBtn(_S.uuid(_S.bmpText("Easy",cfg),"#easy")),
              b2= _I.mkBtn(_S.uuid(_S.bmpText("Normal",cfg),"#normal")),
              b3=_I.mkBtn(_S.uuid(_S.bmpText("Hard",cfg),"#hard"));
            function cb(b){
              let mode= b.m5.uuid=="#easy"?-1:(b.m5.uuid=="#hard"?1:0);
              playClick();
              b.tint=C_ORANGE;
              _.delay(CLICK_DELAY,()=> _Z.runEx("PlayGame",{mode}));
            }
            b1.m5.press=
            b2.m5.press= b3.m5.press = cb;
            self.insert(_Z.layoutY([b1, space(), b2, space(), b3], {bg:"#cccccc"}));
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this) && this.g.doChoices();
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    _Z.scene("PlayGame",{
      setup(options){
        const
          self=this,
          K=Mojo.getScaleFactor(),
          lw=Math.max(2,int(2*K));
        _.inject(this.g,{
          drawGrid(grid,gfx){
            let h= grid.length,
              w= grid[0].length;
            //horz lines
            gfx.moveTo(grid[2][0].x1,grid[2][0].y2);
            gfx.lineTo(grid[2][w-1].x2,grid[2][w-1].y2);
            gfx.moveTo(grid[5][0].x1,grid[5][0].y2);
            gfx.lineTo(grid[5][w-1].x2,grid[5][w-1].y2);
            gfx.stroke({width:lw,color:_S.SomeColors.white});
            //vert lines
            gfx.moveTo(grid[0][2].x2,grid[0][2].y1);
            gfx.lineTo(grid[h-1][2].x2,grid[h-1][2].y2);
            gfx.moveTo(grid[0][5].x2,grid[0][5].y1);
            gfx.lineTo(grid[h-1][5].x2,grid[h-1][5].y2);
            gfx.stroke({width:lw,color:_S.SomeColors.white});
            return gfx;
          },
          initLevel(){
            let out={},
              grid= _S.gridSQ(9,0.9,out),
              c= grid[0][0],
              w= c.x2-c.x1,
              h= c.y2-c.y1,
              gfx=self.insert(_S.drawGridBox(out,lw,"white"));
            this.drawGrid(grid,gfx);
            _.inject(_G,{
              tileW:w,
              tileH:h,
              grid,
              prevAction:UNDEF,
              cache: initCache(w,h,{}),
              sudoku: _G.Sudoku.generate(options.mode)
            });
            return this;
          },
          initGame(){
            for(let r,game=_G.sudoku, y=0;y<_G.DIM;++y){
              r=_G.grid[y];
              for(let cx,cy,v,s,g,x=0;x<_G.DIM;++x){
                g=r[x];
                cx=_M.ndiv(g.x1+g.x2,2);
                cy=_M.ndiv(g.y1+g.y2,2);
                if((v=game[y][x]) != 0){
                  s= _G.cache[v].pop();
                  s.tint=_S.color("#f27c2e");
                  s.g.value=v;
                  self.insert(_V.set(s,cx,cy));
                }else{
                  s=_S.sprite("cell.png");
                  s.g.value=0;
                  s.g.cell=true;
                  idleColor(s);
                  _V.set(_S.centerAnchor(s),cx,cy);
                  s.m5.press=()=>{
                    if(_G.curMarked===s){
                      deselect();
                    }else{
                      select(s);
                    }
                  }
                  self.insert(_S.sizeXY(_I.mkBtn(s),_G.tileW,_G.tileH));
                }
                s.g.row=y;
                s.g.col=x;
              }
            }
            return this;
          },
          initSel(){
            let
              K=Mojo.getScaleFactor(),
              pad= 8 *K,
              g=_G.grid[0][0],
              w=g.x2-g.x1,
              p,h=g.y2-g.y1,
              W=_S.SomeColors.black,//white,
              C=_S.color("#56d5ef");
            for(let n,i=0;i<_G.NUMINTS.length;++i){
              n=_G.NUMINTS[i];
              let s= _G.cache[n].pop();
              s.children[0].tint=W;
              s.g.value=n;
              s.tint=C;
              if(n==1){
                s.y= _M.ndiv(g.y1+g.y2,2);
                s.x= _M.ndiv(g.x1+g.x2,2) - s.width - pad;
                p= self.insert(_I.mkBtn(s));
              }else{
                _S.pinBelow(p,s,0);
                p=self.insert(_I.mkBtn(s));
              }
              s.m5.press=()=> assign(s.g.value);
            }
            return this;
          },
          initHUD(){
            let p,s=_S.sizeXY(_S.sprite("cell.png"),_G.tileW,_G.tileH),
              g=_G.grid[0][_G.grid[0].length-1],
              K=Mojo.getScaleFactor(),
              cy= _M.ndiv(g.y1 +g.y2,2),
              cx= int(g.x2 + 8*K + s.width/2);
            _V.set(_S.centerAnchor(s),cx,cy);
            s.addChild(_S.centerAnchor(_S.bmpText("U",FONTCFG)));
            s.m5.press=()=>{
              if(_G.prevAction){
                _G.prevAction.undo();
                _G.prevAction=UNDEF;
              }
            }
            s.tint=_S.color("magenta");
            this.undoBtn=s;
            p=self.insert(_I.mkBtn(s));
            ///
            let s2=_S.sizeXY(_S.sprite("cell.png"),_G.tileW,_G.tileH);
            _S.centerAnchor(s2);
            s2.addChild(_S.centerAnchor(_S.bmpText("X",FONTCFG)));
            s2.m5.press=()=> erase();
            s2.tint=_S.color("red");
            this.eraseBtn=s2;
            _S.pinBelow(p,s2,0);
            return self.insert(_I.mkBtn(s2));
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this) && this.g.initLevel() &&
          this.g.initGame() && this.g.initSel() && this.g.initHUD();
        _Z.run("AudioIcon",{
          xOffset: -10*K, yOffset:0
        });
      },
      postUpdate(dt){
        if(this.g.undoBtn){
          this.g.undoBtn.alpha= _G.prevAction?1:0.4;
        }
        if(this.g.eraseBtn){
          let found;
          for(let s,i=0; i<this.children.length;++i){
            s=this.children[i];
            if(s.g && s.g.cell && s.g.value != 0){
              found=1;
              break;
            }
          }
          this.g.eraseBtn.alpha= found?1:0.4;
        }
        let c= _G.Sudoku.validate(_G.sudoku);
        if(c){
          this.m5.dead=true;
          _Z.modal("EndGame",{msg:"You Win!"});
        }
        if(_I.keyDown(_I.SPACE)){
          //_.log("==> " + JSON.stringify(_G.sudoku));
        }
      }
    });

    _Z.run("Splash", SplashCfg);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load & run
  MojoH5Ldr({
    assetFiles: ["bg.jpg","cell.png",
                 "game_over.mp3","game_win.mp3","click.mp3","error.mp3"],
    arena: {width: 1344, height: 840},
    scaleToWindow:"max",
    scaleFit:"y",
    start(...args){ scenes(...args) }
  });

})(this);


