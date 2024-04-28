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
 * Copyright © 2020-2024, Kenneth Leung. All rights reserved. */

;(function(window,UNDEF){

  "use strict";

	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  function scenes(Mojo){

    const int=Math.floor;
    const {Scenes:_Z,
			     Sprites:_S,
			     v2:_V,
			     math:_M,
			     Game:_G,ute:_,is}=Mojo;

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const
      UI_FONT=Mojo.DOKI_LOWER,
		  SplashCfg= {
				title:"Space Warp",
				action: {name:"PlayGame"},
				clickSnd:"click.mp3",
			};

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("PlayGame",{
      setup(){
				let
				  K=Mojo.getScaleFactor(),
					action=Mojo.touchDevice?"Tap":"Click",
					m=Mojo.Sprites.bmpText(`${action} to warp!`, UI_FONT, 48*K);

				let w= _Z.run("SpaceWarp", {static:true});

				this.g.warpScene=w;
				this.g.warpBtn=m;

				function warping(){
					if(!w.isBusy()){
						Mojo.sound("warp.mp3").play();
						w.warp();
						Mojo.Sprites.hide(m);
					}
				}
				const sub= function(){
					warping();
        };
				this.g.click=sub;
        Mojo.Input.on(["single.tap"],sub);

				if(!Mojo.touchDevice){
            this.g.space= Mojo.Input.keybd(Mojo.Input.SPACE,()=>{
							warping()
            });
				}

				Mojo.Sprites.tint(m,"#81D4FA");
				_V.set(m, Mojo.width/2,Mojo.height- m.height*3);
				this.insert(Mojo.Sprites.centerAnchor(m));
      },
			dispose(){
				Mojo.Input.off(["single.tap"],this.g.click);
				this.g.space?.dispose();
			},
      postUpdate(dt){
				if(!this.g.warpScene.isBusy()){
					if(!this.g.warpBtn.visible){
						_.delay(3000, ()=> Mojo.Sprites.show(this.g.warpBtn));
					}
				}
      }
    });

		_Z.run("Splash", SplashCfg);
  }

	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
	MojoH5Ldr({
		assetFiles: ["click.mp3", "warp.mp3"],
		arena: {width: 1344, height: 840},
    scaleToWindow:"max",
		scaleFit:"x",
    start(...args){ scenes(...args) }
	});

})(this);





