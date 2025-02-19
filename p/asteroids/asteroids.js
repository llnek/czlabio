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
  /* */
  ////////////////////////////////////////////////////////////////////////////
  function scenes(Mojo){
    const {Scenes:_Z,
           Sprites:_S,
           FX:_F,
           Input:_I,
           Game:_G,
           Ute2D:_U,
           v2:_V,
           math:_M,
           ute:_,is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const E_SHIP=1, E_ASTRO=2, E_LASER=4;
    const KIND_1=1, KIND_2=2, KIND_3=3;

    const
      UI_FONT=Mojo.DOKI_LOWER,
      DELAY=343,
      int=Math.floor,
      PI2=Math.PI*2,
      //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
      //type of asteroid, big,medium,small
      LaserSpeed=363,
      FIRE_WAIT=343,
      MAX_TURN= 333,
      TURN_RANGE= 666,
      SplashCfg= {
        title:"Asteroids",
        clickSnd:"click.mp3",
        action: {name:"PlayGame"}
      };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    function fireLaser(s){
      let
        [C,S]= _S.getHeading(s),
        K=Mojo.getScaleFactor(),
        y=s.y+s.height*S* 0.5,
        x=s.x+s.height*C* 0.5,
        b= takeLaser(), v=LaserSpeed*K;

      _G.shoot.play();
      _V.set(b,x,y);
      _V.set(b.m5.vel,v*C,v*S);
      _G.gameScene.engrid( _S.setOrient(b,s.angle,true));
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    function mkShip(scene,X,Y){
      let
        K= Mojo.getScaleFactor(),
        omega=0,
        acc=4*K,
        img=Mojo.resource("rocket.png"),
        s= _S.sprite(_S.frames(img,img.width/2,img.height));

      _S.tint(_S.centerAnchor(s),_S.SomeColors.red);
      _S.scaleXY(s,0.1*K,0.1*K);
      s.m5.showFrame(0);
      s.m5.type=E_SHIP;
      s.angle= 0;

      if(1){
        let b=_S.tint(_S.bmpText("BOOM",UI_FONT,32*K),_S.SomeColors.yellow);
        scene.insert(b);
        _G.boomMsg= _S.centerAnchor(_S.hide(b));
      }

      s.m5.tick=(dt)=>{
        let
          tt= TURN_RANGE*dt,
          u= _I.keyDown(_I.UP),
          l=_I.keyDown(_I.LEFT),
          r= _I.keyDown(_I.RIGHT),
          f= _I.keyDown(_I.SPACE);
        s.m5.showFrame(u?1:0);
        //interpolate the turn
        s.angle += omega * dt;
        _S.clamp2Pi(s);
        omega *=  1-dt;
        if(r){ omega += tt }
        if(l){ omega -= tt }
        omega=_M.clamp(-MAX_TURN,MAX_TURN,omega);
        if(u){
          if(s.m5.acc[0]==0)
            _V.set(s.m5.acc,acc,acc);
          _V.add$(s.m5.vel, _V.mul$(_S.getHeading(s),s.m5.acc));
        }
        if(f && !s.g.fireThrottle){
          scene.future(()=>{ s.g.fireThrottle=0 },FIRE_WAIT);
          fireLaser(_G.ship);
          s.g.fireThrottle=1;
        }
        repos(_S.move(s,dt));
      };
      s.g.onHit=(b)=>{
        _S.hide(scene.degrid(s));
        _G.explode.play();
        b=_G.health.dec();
        _S.scaleXY(_G.boomMsg,0.1,0.1);
        _V.set(_G.boomMsg, s.x, s.y);
        _F.tweenScale(_S.show(_G.boomMsg),_F.EASE_OUT_SINE, [0,1],[0,1]).onComplete=()=>{
          _S.hide(_G.boomMsg);
          _V.set(s.m5.vel,0,0);
          _V.set(s.m5.acc,0,0);
          if(b){
            mkShield(scene, scene.engrid(_S.show(_S.centerObj(s))))
          }else{
            Mojo.off(["hit",s],"onHit",s.g);
            _S.die(scene) && _.delay(DELAY, ()=> _Z.modal("EndGame",{
              replay:{name:"PlayGame"},
              quit:{name:"Splash",cfg:SplashCfg},
              msg:"You Lose!",
              winner:0
            }));
          }
        }
      };
      Mojo.on(["hit",s],"onHit",s.g);
      return mkShield(scene, _V.set(s,X,Y));
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    function mkShield(scene,ship){
      let t= _F.pulse(ship,0.4);
      scene.future(()=>{
        _F.remove(t);
        ship.g.shield=false;
        ship.alpha=1;
        ship.tint=_S.SomeColors.red; }, 10*DELAY);
      _S.tint(ship,_S.SomeColors.cyan);
      return (ship.g.shield=true) && ship;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    function takeLaser(){
      //console.log("taking a bullet");
      let o, K=Mojo.getScaleFactor();
      if(_G.bullets.length>0){
        o=_G.bullets.pop()
      }else{
        o=_S.centerAnchor(_S.sprite("laser.png"));
        _S.scaleBy(o, 0.8*K, 0.2*K);
        _S.tint(o,_S.SomeColors.yellow);
        o.m5.type=E_LASER;
        o.m5.tick=(dt)=> o.m5.dead?0:repos(_S.move(o,dt));
        o.g.onHit=()=> dropLaser(o);
        _G.gameScene.insert(o,true);
      }
      Mojo.on(["hit",o],"onHit",o.g);
      return _S.show(_S.undie(o));
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    function dropLaser(o){
      //console.log("got rid of a bullet");
      Mojo.off(["hit",o],"onHit",o.g);
      _G.bullets.push(o);
      return _G.gameScene.degrid(_S.hide(_S.die(o)));
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    function repos(p){
      let r=p.width/2;
      if(p.m5.type==E_LASER){
        if(p.x-r>Mojo.width ||
           p.x+r<0 ||
           p.y-r>Mojo.height||
           p.y+r<0){
          dropLaser(p)
        }
      }else{
        //asteroids and ship
        if(p.x-r>Mojo.width){
          p.x= -r;
        }else if(p.x+r<0){
          p.x=Mojo.width+r;
        }
        if(p.y-r>Mojo.height){
          p.y= -r;
        }else if(p.y+r<0){
          p.y=Mojo.height+r;
        }
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    function takeAstro(kind){
      let o;
      if(kind != KIND_3 || _G.as3.length==0){
        o=mkAstro(kind)
      }else{
        //_.log("got a3");
        o=_G.as3.pop();
      }
      Mojo.on(["hit",o],"onHit",o.g);
      return _G.astros.push(_S.show(o)) && _S.undie(o);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    function dropAstro(a){
      Mojo.off(["hit",a],"onHit",a.g);
      if(a.g.rank==KIND_3){
        //_.log("put a3 back");
        _G.as3.push(a);
      }else{
        //_.log("astro die");
        _G.gameScene.queueForRemoval(a);
      }
      return _S.hide(_G.gameScene.degrid(_S.die(a)));
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    function mkAstro(kind){
      let
        K= Mojo.getScaleFactor(),
        a= _S.sprite("astro.png"),
        speed, rao, twist = _.randSign();
      _S.scaleXY(_S.centerAnchor(a),0.5*K,0.5*K);
      a.m5.cmask=E_SHIP|E_LASER;
      a.m5.type=E_ASTRO;
      a.m5.circle=true;
      a.g.rank=kind;
      switch(kind){
        case KIND_1:
          rao=0.4;
          speed=100;
          break;
        case KIND_2:
          speed=120;
          rao=0.15;
          break;
        case KIND_3:
          speed=140;
          rao=0.05;
          break;
      }
      a.m5.speed=speed*K;
      _S.scaleXY(a,rao*K,rao*K);
      a.m5.tick=(dt)=>{
        repos(_S.move(a,dt));
        a.angle += twist*0.2*K;
      }
      a.g.onHit=(col)=>{
        if(col.B.m5.type==E_LASER){
          a.g.explode(col.B)
        }
      };
      a.g.explode=(B)=>{
        let
          len=0,
          X=a.x,
          Y=a.y,
          t= a.g.rank==KIND_1?KIND_2:(a.g.rank==KIND_2?KIND_3:0);
        dropLaser(B);
        dropAstro(a);
        if(t==KIND_2){ len=_G.RANK2 }
        if(t==KIND_3){ len=_G.RANK3 }
        for(let g,x,i=0;i<len;++i){
          x= takeAstro(t);
          g= 120*(i + _.rand());
          _V.set(x.m5.vel,Math.cos(g)*x.m5.speed*_.randSign(),
                          Math.sin(g)*x.m5.speed*_.randSign());
          _G.gameScene.insert(_V.set(x,X,Y),true);
        }
        _G.explode.play();
        _G.score += a.g.rank * 100;
      }
      return _S.tint(a,_S.SomeColors.orange);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("PlayGame", {
      setup(){
        let
          self=this,
          K=Mojo.getScaleFactor();
        _.inject(this.g,{
          initLevel(){
            _.inject(_G,{
              explode:Mojo.sound("explosion.mp3"),
              shoot:Mojo.sound("shoot.mp3"),
              gameScene:self,
              score:0,
              bullets:[],
              astros:[],
              as3:[],
              RANK1:4,
              RANK2:3,
              RANK3:6
            });
            //pool stuff
            _.fill(int(_G.RANK1*_G.RANK2*_G.RANK3/2),
                   ()=> takeAstro(KIND_3)).forEach(o=>dropAstro(o));
            _.fill(20,()=> takeLaser()).forEach(o=> dropLaser(o));
            return this;
          },
          initAstros(){
            let
              G=_S.divXY([3,3],1,1),
              A=_S.sprite("astro.png"),
              nums=[0,1,2,3,5,6,7,8],
              py,cy=Mojo.height/2,
              px,cx=Mojo.width/2,
              total=_G.RANK1,
              a,g,n, vx,vy,speed=100*K;
            while(total>0){
              n=_.randItem(_.shuffle(nums));
              _.disj(nums,n);
              g=G[int(n/3)][n%3];
              px=g.x1+ (g.x2-g.x1)/2;
              py=g.y1+ (g.y2-g.y1)/2;
              a=takeAstro(KIND_1);
              vx=px>cx? -speed: speed;
              vy=py>cy? -speed: speed;
              _V.set(a.m5.vel,vx,vy);
              _V.set(a,px,py);
              --total;
              self.insert(a,true);
            }
            return this;
          },
          initShip(){
            let s= mkShip(self, Mojo.width/2, Mojo.height/2);
            return _G.ship=self.insert(s,true);
          },
          initHUD(){
            let
              s,
              b=_U.healthBar({
                width:150*K,
                height:20*K,
                borderWidth:2*K,
                scale:K,
                lives:3,
                line: "white",
                fill: _S.BtnColors.green
              });
            _V.set(b.sprite,0,0);
            _G.health=b;
            self.insert(b.sprite);
            s= this.scoreText= _S.bmpText("0",UI_FONT,32*K);
            _V.set(_S.anchorXY(s,0.5,0),Mojo.width/2,0);
            return self.insert(s);
          }
        });
        _Z.run("StarfieldBg",{static:true});
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initLevel() &&
          this.g.initAstros() &&
          this.g.initShip() && this.g.initHUD();
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        _Z.run("AudioIcon",{
          //xScale:K, yScale:K,
          xOffset: -10*K, yOffset:0
        });
        if(1){
          _Z.run("HotKeys",{ down:false, fire:true });
        }
      },
      postUpdate(dt){
        let a,i;
        this.g.scoreText.text=`${_G.score}`;
        for(i=_G.astros.length-1;i>=0;--i){
          a=_G.astros[i];
          a.m5.dead?0:this.searchSGrid(a).forEach(o=>{
            if(a.m5.type==E_ASTRO && o.m5.type==E_SHIP){
              o.g.shield?0: _S.hit(a,o)
            }else{
              _S.hit(a,o)
            }
          })
        }
        a=_G.astros.filter(o=> !o.m5.dead);
        a=_.append(_G.astros, a, true);
        if(a.length==0){
          Mojo.off(_G.ship.g);
          _S.die(this) &&
            _.delay(DELAY, ()=> _Z.modal("EndGame",{
              replay:{name:"PlayGame"},
              quit:{name: "Splash", cfg:SplashCfg},
              msg:"You Win!",
              winner:1
            }));
        }
      }
    });

    _Z.run("Splash",SplashCfg);
  }
  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  MojoH5Ldr({
    assetFiles: ["audioOn.png","audioOff.png", "astro.png","rocket.png","laser.png",
                 "shoot.mp3","explosion.mp3", "click.mp3","game_over.mp3","game_win.mp3"],
    arena: {width: 1344, height: 840},
    scaleToWindow: "max",
    scaleFit:"x",
    start(...args){ scenes(...args) }
  });

})(this);


