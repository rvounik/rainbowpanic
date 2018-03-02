
// register keys that are used in the game
window.addEventListener("keydown", function(e) {
  if([68, 77].indexOf(e.keyCode) > -1) {
    e.preventDefault();
  }
}, false);

// add a listener for orientation change and rescale
window.document.addEventListener('orientationchange', function() {
  window.scrollTo(0, 0);
  if(window.innerHeight < 520){
    var scale = Math.min(window.innerWidth / 640, window.innerHeight / 800); // first attempt at fixing needless / ugly scaling on (i?)phone
  } else {
    var scale = 1;
  }
  stage.scaleX = scale;
  stage.scaleY = scale;
  stage.canvas.width =  640 * scale;
  stage.canvas.height = 800 * scale;
  window.scrollTo(0, 0);

}, false);

// define all vars & parameters
var canvas, stage, KEYCODE_D = 68, KEYCODE_M = 77, res = 75, gamestarted = false, busy = true, vcList = [], debug = false, starttime = newcountdown =  100;
var biggestCombo = 0, introstarted = false, musicoff = false, layoverList = [], pingplaying = false, blockplaying = false, shakeDown = false, shakecount = 0;
smokeList = [], levelupplayed = false, currentLevel = 1, score = 0, preludeContainerList = [], bonusContainerList = [], bonussoundplaying = false, endstarted = false, shardList = [];

// initialise preloadJS
var loadingInterval = 0, preload;

// define preloadJS functions
function updateLoading(event) {
  progress.graphics.clear();
  progress.graphics.beginFill("#fff").drawRect(220, 230, 200 * (event.loaded / event.total), 40);
  stage.update();
}
function doneLoading(event) {
  clearInterval(loadingInterval);
  stage.removeChild(progress);
  stage.removeChild(progressbar);
  stage.removeChild(progresstext);
  stage.removeChild(soundtext);
  init();
}

// the preloading
function preload() {

  // create the canvas (needs to be there early to draw the loading bar into
  canvas = document.getElementById("myCanvas");
  stage = new createjs.Stage(canvas);

  progresstext = new createjs.Text('LOADING', "24px Oswald", "#aaa");
  progresstext.x = 278;
  progresstext.y = 180;
  stage.addChild(progresstext);
  soundtext = new createjs.Text('PLEASE TURN UP YOUR VOLUME', "14px Oswald", "#333");
  soundtext.x = 230;
  soundtext.y = 780;
  stage.addChild(soundtext);
  progressbar = new createjs.Shape();
  progressbar.graphics.setStrokeStyle(2, "round").beginStroke("#aaa").drawRect(220, 230, 200, 40);
  stage.addChild(progressbar);
  progress = new createjs.Shape();
  stage.addChild(progress);

  stage.update();


  // define all preloaded assets
  var manifest = [
    {id:"tiles", src:"img/rainbow-sheet-tiles.png"},
    {id:"shard-red", src:"img/rainbow-sheet-shards.png"},
    {id:"titlesmall", src:"img/rainbow-titlesmall.png"},
    {id:"title01", src:"img/rainbow-title01.png"},
    {id:"title02", src:"img/rainbow-title02.png"},
    {id:"titlesmall01", src:"img/rainbow-titlesmall01.png"},
    {id:"titlesmall02", src:"img/rainbow-titlesmall02.png"},
    {id:"thatsall", src:"img/rainbow-thatsallfolks.png"},
    {id:"lvl1", src:"audio/lvl1.mp3"},
    {id:"lvl2", src:"audio/lvl2.mp3"},
    {id:"lvl3", src:"audio/lvl3.mp3"},
    {id:"lvl4", src:"audio/lvl4.mp3"},
    {id:"lvl5", src:"audio/lvl5.mp3"},
    {id:"block", src:"audio/block.mp3"},
    {id:"combo", src:"audio/combo.mp3"},
    {id:"triplecombo", src:"audio/triplecombo.mp3"},
    {id:"quadcombo", src:"audio/quadcombo.mp3"},
    {id:"megacombo", src:"audio/megacombo.mp3"},
    {id:"bigblock", src:"audio/bigblock.mp3"},
    {id:"gameover", src:"audio/gameover.mp3"},
    {id:"levelup", src:"audio/levelup.mp3"},
    {id:"newrecord", src:"audio/newrecord.mp3"},
    {id:"ping", src:"audio/rainbow-ping.mp3"},
    {id:"collapse", src:"audio/collapse.mp3"},
    {id:"extrapoints", src:"audio/extrapoints.mp3"},
    {id:"getready", src:"audio/getready.mp3"},
    {id:"preludeloop", src:"audio/preludeloop.mp3"},
    {id:"rick", src:"audio/rick.mp3"},
    {id:"hitwall", src:"audio/hitwall.mp3"}
  ];

  // preload the assets
  preload = new createjs.LoadQueue();
  preload.installPlugin(createjs.Sound);
  preload.installPlugin(createjs.Image);
  preload.addEventListener("complete", doneLoading);
  preload.addEventListener("progress", updateLoading);
  preload.loadManifest(manifest);
}

function init(){

  // define ticker
  createjs.Ticker.addEventListener("tick", handleTick);
  createjs.Ticker.setFPS(30);

  // define onkeydown
  document.onkeydown = handleKeyDown;

  // define touch
  createjs.Touch.enable(stage, true, false);

  //create instances from the preloaded sounds
  createjs.Sound.registerSound(preload.getResult("block"), "", 1); // allow only one instance to play
  createjs.Sound.registerSound(preload.getResult("bigblock"));
  createjs.Sound.registerSound(preload.getResult("combo"));
  createjs.Sound.registerSound(preload.getResult("triplecombo"));
  createjs.Sound.registerSound(preload.getResult("quadcombo"));
  createjs.Sound.registerSound(preload.getResult("megacombo"));
  createjs.Sound.registerSound(preload.getResult("gameover"));
  createjs.Sound.registerSound(preload.getResult("levelup"));
  createjs.Sound.registerSound(preload.getResult("newrecord"));
  createjs.Sound.registerSound(preload.getResult("ping"), "" ,1);
  createjs.Sound.registerSound(preload.getResult("collapse"), "" ,1);
  createjs.Sound.registerSound(preload.getResult("extrapoints"), "" ,1);
  createjs.Sound.registerSound(preload.getResult("getready"));
  createjs.Sound.registerSound(preload.getResult("preludeloop"));
  createjs.Sound.registerSound(preload.getResult("rick"));
  createjs.Sound.registerSound(preload.getResult("hitwall"));

  //creates the shard spritesheet
  ss_shards = new createjs.SpriteSheet({
    "animations":
    {
      tile0: 0, // blue
      tile1: 1, // yellow
      tile2: 2, // purple
      tile3: 3, // green
      tile4: 4, // red
      tile5: 5, // d blue
      tile6: 6  // orange

    },
    "images": [preload.getResult("shard-red")],
    "frames":
    {
      height: 25,
      width:  25,
      regX:   12,
      regY:   12
    }
  });

  // build main container
  mainContainer = new createjs.Container();
  mainContainer.x = mainContainer.y = 0;
  stage.addChild(mainContainer);

  // load spritesheet
  ss_tiles = new createjs.SpriteSheet({
    "animations":
    {
      tile0: 0,
      tile1: 1,
      tile2: 2,
      tile3: 3,
      tile4: 4,
      tile5: 5,
      tile6: 6,
      tile7: 7, // rainbow tile
      tile8: 8, // indestructible wall
      tile99: 16 // attention icon
    },
    "images": [preload.getResult("tiles")],
    "frames":
    {
      height:res,
      width: res,
      regX: 0,
      regY: 0
    }
  });

  // load spritesheet
  ss_tiles2 = new createjs.SpriteSheet({
    "animations":
    {
      tile0: 9,
      tile1: 10,
      tile2: 11,
      tile3: 12,
      tile4: 13,
      tile5: 14,
      tile6: 15
    },
    "images": [preload.getResult("tiles")],
    "frames":
    {
      height:res,
      width: res,
      regX: 0,
      regY: 0
    }
  });
  fps = new createjs.Text("", "14px Arial", "#fff");
  fps.x = 5;
  fps.y = 5;
  stage.addChild(fps);

  createFrontend();

}

function createFrontend(){

  title_bg = new createjs.Shape();
  title_bg.graphics.beginFill('#000').drawRect(0, 0, 640, 155).endFill();
  mainContainer.addChild(title_bg);
  title1 = preload.getResult("title01");
  title1 = new createjs.Bitmap(title1);
  title1.x = 20;
  title1.y = 15;
  title1.glow = 4;
  mainContainer.addChild(title1);
  title2 = preload.getResult("title02");
  title2 = new createjs.Bitmap(title2);
  title2.x = 20;
  title2.y = 15;
  mainContainer.addChild(title2);

  colour = parseInt(5 * Math.random());

  sprite = new createjs.Sprite(ss_tiles, "tile" + colour);
  sprite.x = -10;
  sprite.y = sprite.starty = 300;
  sprite.sin = 0;
  mainContainer.addChild(sprite);
  sprite2 = new createjs.Sprite(ss_tiles, "tile" + colour);
  sprite2.x = - 110;
  sprite2.y = sprite2.starty = 300;
  sprite2.sin = Math.PI / 2;
  mainContainer.addChild(sprite2);
  sprite3 = new createjs.Sprite(ss_tiles, "tile" + colour);
  sprite3.x = - 270;
  sprite3.y = 320;
  mainContainer.addChild(sprite3);

  introspriteadd = 10;

  instr = "Work your way through 25 levels of colour-matching madness!\nTake away blocks to form similar coloured groups of varying\nlength. Combine groups to form combo's, and try to achieve \nthe bonus goals! Will you be able to make it to the last level?\n";
  instructions = new createjs.Text(instr, "24px Oswald", "#aaa");
  instructions.x = 320;
  instructions.y = 445;
  instructions.lineHeight = 40;
  instructions.textAlign = "center";
  mainContainer.addChild(instructions);

  btn_start_bg = new createjs.Shape();
  btn_start_bg.graphics.beginFill('#fff').drawRect(220, 627, 200, 60).endFill();
  btn_start_bg.shadow = new createjs.Shadow("#aaa", 0, 0, 0);
  mainContainer.addChild(btn_start_bg);
  btn_start = new createjs.Text('START GAME', "24px Oswald", "#000");
  btn_start.lineheight = 24;
  btn_start.x = 260;
  btn_start.y = 645;
  mainContainer.addChild(btn_start);
  btn_start_bg.addEventListener("click", function(event) {
    if(!gamestarted){
      createLevel();
    }
  });

  smallprint = new createjs.Text('OPTIMIZED FOR MOBILE & DESKTOP. (C) RVO 2014', "14px Oswald", "#333");
  smallprint.x = 183;
  smallprint.y = 780;
  smallprint.lineHeight = 40;
  mainContainer.addChild(smallprint);

  introstarted = true;

}

// creates the level (tiles, music, goals etc) also creates a (new) game (containers, title, timer, properties)
function createLevel(){

  /*
   levelProperties holds properties for each level. syntax: [tiles],starting value of timer,music,min score, min similar for group,[bonus],[bonus2],[attention],[[probability, special tile id (7,8 aor 9)]]
   bonus: [[NUM,TILEID,POINTS]]
   bonus2: [[NUM,TILEID,POINTS]]
   attention: [[tileid,text]]
   REMEMBER: ONLY 3 GOALS IN TOTAL, ONLY 3 ATTENTIONS (OF WHICH ONLY ONE IS SHOWN ON PRELUDE SCREEN)
   */

  levelProperties = [

    // world 1
    [[0, 1, 2, 3],       200, 'lvl1', '2000', '4', [[5, 3, 100],  [5, 0, 100]],  [[5, 0, 50]],  [[99, 'taking away blocks will cost you 10 points'],[99, 'each level has different goals'],[99, 'bonus goals are listed on the left']], [] ],
    [[0, 1, 2, 3],       180, 'lvl1', '3000', '4', [[6, 2, 100],  [6, 3, 100]],  [[5, 1, 50]],  [[99, 'a combination of groups is called a combo'], [99, 'big combos can quickly increase your score'],[99, 'reach the target score to continue']], [] ],
    [[0, 1, 2, 3, 4],    200, 'lvl1', '1500', '4', [[7, 1, 100],  [7, 2, 100]],  [[5, 2, 50]],  [[4, 'a new block colour is added'], [99, 'it will become harder to form groups']], [] ],
    [[0, 1, 2, 3, 4],    200, 'lvl1', '1500', '5', [[9, 4, 100],  [9, 0, 100]],  [[5, 3, 50]], [[99, 'this time, you need 5 blocks to form a group']], [] ],
    [[0, 1, 2, 3, 4],    150, 'lvl1', '2000', '5', [[10, 0, 200], [10, 1, 200]], [[5, 4, 50]], [[99, 'you have almost made it to world 2!'], [99, 'you will always restart in the last world']],[] ],

    // world 2
    [[0, 1, 2, 3, 4],       200, 'lvl2', '1500', '4', [[11, 4, 100], [11, 0, 100]], [[6, 1, 100]], [[99, 'some tiles can provide extra points']], [[25, 9]] ],
    [[0, 1, 2, 3],          100, 'lvl2', '1500', '5', [[12, 0, 100], [12, 1, 100]], [[6, 2, 100]], [[99, 'move quick!']], [[25, 9]] ],
    [[0, 1, 2, 3, 4],       150, 'lvl2', '2000', '4', [[13, 3, 100], [13, 4, 100]], [[6, 2, 100]], [[7, 'rainbow tiles can substitute any colour']], [[50, 9], [25, 7]] ],
    [[0, 1, 2, 3, 4, 5],    150, 'lvl2', '1000', '4', [[14, 5, 100], [14, 4, 100]], [[6, 4, 100]], [[5, 'a new block colour is added']], [[100, 9], [25, 7]] ],
    [[0, 1, 2, 3, 4, 5],    100, 'lvl2', '1000', '5', [[15, 1, 200], [15, 0, 200]], [[6, 5, 100]], [[99, 'its the end of the world! (2, that is)']], [[50, 9], [50, 7]] ],

    // world 3
    [[0, 1, 2, 3, 4, 5],       250, 'lvl3', '2000', '5', [[16, 5, 100], [16, 4, 100]], [[7, 0, 150]], [[8, 'a brick block can not be destroyed'],[8, '..or perhaps they can?']],[[35, 9], [50, 7], [10, 8]] ],
    [[0, 1, 2, 3, 4, 5],       200, 'lvl3', '2500', '5', [[17, 2, 100], [17, 3, 100]], [[7, 2, 150]], [[8, 'do you remember boulderdash?']],[[5, 8]] ],
    [[0, 1, 2, 3, 4],          150, 'lvl3', '1500', '4', [[18, 0, 100], [18, 4, 100]], [[7, 4, 150]], [[99, 'move quick!']], [[35, 9], [50, 7]] ],
    [[0, 1, 2, 3, 4, 5, 6],    250, 'lvl3', '1250', '4', [[19, 6, 100], [19, 5, 100]], [[7, 4, 150]], [[6, 'a new block colour is added']],[[35, 7], [25, 8]] ],
    [[0, 1, 2, 3, 4, 5, 6],    150, 'lvl3', '1500', '5', [[20, 2, 200], [20, 4, 200]], [[7, 6, 150]], [[6, 'much group, much colour, much brick']],[[25, 9], [25, 7], [10, 8]] ],

    // world 4
    [[0, 1, 2, 3, 4, 5, 6], 180, 'lvl4', '2000', '5', [[21, 2, 100], [21, 1, 100]], [[8, 1, 200]], [[99, 'easy money']], [[5, 9]] ],
    [[4, 5, 6],             250, 'lvl4', '5000', '5', [[22, 4, 100], [22, 5, 100]], [[8, 6, 200]], [[99, 'tricolore']], [[25, 8]] ],
    [[0, 1, 2, 3, 4, 5, 6], 180, 'lvl4', '2750', '5', [[23, 4, 100], [23, 6, 100]], [[8, 5, 200]], [[99, 'somewhere, over the rainbow']], [[5, 7]] ],
    [[0, 1, 2, 3, 4, 5, 6], 150, 'lvl4', '3000', '5', [[24, 0, 100], [24, 2, 100]], [[8, 6, 200]], [[99, 'you know, writing these hints is kinda hard'],[99, 'but Im doing it all for you']], [[25, 9], [50, 7], [25, 8]] ],
    [[0, 1, 2, 3, 4, 5],    150, 'lvl4', '4000', '5', [[25, 1, 200], [25, 3, 200]], [[8, 4, 200]], [[99, 'this will take some time']], [[25, 9], [50, 7]] ],

    // world 5
    [[0, 1, 2, 3, 4, 5, 6], 200, 'lvl5', '4000', '5', [[25, 1, 200], [25, 2, 200]], [[9, 3, 250]], [[99, 'lets build a castle']],[[5, 8]] ],
    [[0, 1, 2, 3, 4, 5, 6], 180, 'lvl5', '3500', '5', [[25, 3, 200], [25, 4, 200]], [[9, 2, 250]], [[99, 'this may look easy..']],[[25, 9], [50, 7], [25, 8]] ],
    [[0, 1, 2, 3, 4, 5, 6], 150, 'lvl5', '3500', '5', [[25, 5, 200], [25, 6, 200]], [[9, 4, 250]], [[99, 'almost there!']], [[25, 9], [25, 7], [25, 8]] ],
    [[0, 1, 2, 3, 4, 5],    250, 'lvl5', '2500', '6', [[25, 0, 200], [25, 1, 200]], [[9, 5, 250]], [[99, '6 is the magic number']],[[25, 9], [25, 7], [25, 8]] ],
    [[0, 1, 2, 3, 4, 5, 6], 200, 'lvl5', '3000', '6', [[25, 2, 200], [25, 3, 200]], [[9, 6, 250]], [[99, 'no more hints. you know what to do.']],[[15, 9], [15, 7], [15, 8]] ]

  ];

  mainContainer.removeAllChildren();

  // the game itself has its own container
  gameContainer = new createjs.Container();
  gameContainer.x = 20;
  gameContainer.y = 88;
  mainContainer.addChild(gameContainer);

  title_bg = new createjs.Shape();
  title_bg.graphics.beginFill('#000').drawRect(0, 0, 640, 75).endFill();
  mainContainer.addChild(title_bg);
  title1 = preload.getResult("titlesmall01");
  title1 = new createjs.Bitmap(title1);
  title1.x = 185;
  title1.y = 7;
  title1.glow = 4;
  mainContainer.addChild(title1);
  title2 = preload.getResult("titlesmall02");
  title2 = new createjs.Bitmap(title2);
  title2.x = 185;
  title2.y = 7;
  mainContainer.addChild(title2);

  bonusContainerList = []; // contains text instances that are used to show the countdown for level goals

  // score indicator
  countdowntitle = new createjs.Text("SCORE", "bold 30px Inconsolata", "#aaa");
  countdowntitle.x = 542;
  countdowntitle.y = 5;
  mainContainer.addChild(countdowntitle);
  countdown = new createjs.Text(levelProperties[currentLevel - 1][1], "bold 45px Inconsolata", "#fff");
  countdown.x = 620;
  countdown.y = 33;
  countdown.textAlign = "right";
  mainContainer.addChild(countdown);
  newcountdown = countdown.text;

  // level indicator
  lvltexttitle = new createjs.Text("LEVEL", "bold 30px Inconsolata", "#aaa");
  lvltexttitle.x = 20;
  lvltexttitle.y = 5;
  mainContainer.addChild(lvltexttitle);
  currentWorld = parseInt((currentLevel - 1) / 5);
  lvltext = new createjs.Text((currentWorld + 1)+"-"+(currentLevel - (currentWorld * 5)), "bold 45px Inconsolata", "#fff");
  lvltext.x = 20;
  lvltext.y = 32;
  mainContainer.addChild(lvltext);

  // goals indicator (in-game)
  goals_bg = new createjs.Shape();
  goals_bg.graphics.beginFill('#000').drawRect(0, 708, 640, 92).endFill();
  mainContainer.addChild(goals_bg);

  bonusContainer = new createjs.Container();
  bonusContainer.x = 0;
  bonusContainer.y = 708;
  mainContainer.addChild(bonusContainer);

  // bonus 1 (in-game)
  for(bg = 0; bg < levelProperties[currentLevel - 1][5].length; bg ++){
    bonuscount = new createjs.Text(levelProperties[currentLevel - 1][5][bg][0], "12px Arial", "#fff");
    bonuscount.x = 20;
    bonuscount.y = 10 + (bg * 25);
    bonuscount.tileid = levelProperties[currentLevel - 1][5][bg][1];
    bonusContainer.addChild(bonuscount);
    bonusContainerList.push(bonuscount);
    bonustext = new createjs.Text("GROUPS OF", "12px Arial", "#fff");
    bonustext.x = 40;
    bonustext.y = 10 + (bg * 25);
    bonusContainer.addChild(bonustext);
    bonus_sprite = new createjs.Sprite(ss_tiles, "tile" + levelProperties[currentLevel - 1][5][bg][1]);
    bonus_sprite.x = 120;
    bonus_sprite.y = 7 + (bg * 25);
    bonus_sprite.scaleX = bonus_sprite.scaleY = 0.2;
    bonusContainer.addChild(bonus_sprite);
    bonustext = new createjs.Text(" BLOCKS = "+levelProperties[currentLevel - 1][5][bg][2] + " POINTS", "12px Arial", "#fff");
    bonustext.x = 140;
    bonustext.y = 10 + (bg * 25);
    bonusContainer.addChild(bonustext);
  }
  // bonus 2 (in-game)
  for(bg = 0; bg < levelProperties[currentLevel - 1][6].length; bg ++){
    bonustext = new createjs.Text("A GROUP OF ", "12px Arial", "#fff");
    bonustext.x = 20;
    bonustext.y = 10 + (levelProperties[currentLevel - 1][5].length * 25) + (bg * 25);
    bonusContainer.addChild(bonustext);
    bonuscount = new createjs.Text(levelProperties[currentLevel - 1][6][bg][0], "12px Arial", "#fff");
    bonuscount.x = 100;
    bonuscount.y = 10 + (levelProperties[currentLevel - 1][5].length * 25)  + (bg * 25);
    bonusContainer.addChild(bonuscount);
    bonus_sprite = new createjs.Sprite(ss_tiles, "tile" + levelProperties[currentLevel - 1][6][bg][1]);
    bonus_sprite.x = 120;
    bonus_sprite.y = 7 + (levelProperties[currentLevel - 1][5].length * 25)  + (bg * 25);
    bonus_sprite.scaleX = bonus_sprite.scaleY = 0.2;
    bonusContainer.addChild(bonus_sprite);
    bonustext = new createjs.Text("BLOCKS = "+levelProperties[currentLevel - 1][6][bg][2] + " POINTS", "12px Arial", "#fff");
    bonustext.x = 145;
    bonustext.y = 10 + (levelProperties[currentLevel - 1][5].length * 25)  + (bg * 25);
    bonusContainer.addChild(bonustext);
  }
  // attention (in-game)
  for(bg = 0; bg < levelProperties[currentLevel - 1][7].length; bg ++){
    bonus_sprite = new createjs.Sprite(ss_tiles, "tile" + levelProperties[currentLevel - 1][7][bg][0]);
    bonus_sprite.x = 295;
    bonus_sprite.y = 3 + (bg * 25);
    bonus_sprite.scaleX = bonus_sprite.scaleY = 0.25;
    bonusContainer.addChild(bonus_sprite);
    bonustext = new createjs.Text(levelProperties[currentLevel - 1][7][bg][1].toUpperCase(), "12px Arial", "#fff");
    bonustext.x = 320;
    bonustext.y = 10 + (bg * 25);
    bonusContainer.addChild(bonustext);
  }

  // set some vars that are used for each level
  clickplayed = false;
  gamestarted = false; // temporarily disable the game to prevent timer routine kicking in
  checkingAdjacents = false;
  checkingMovements = false;
  scoregfxList = [];
  combocounter= 0;
  shardList = [];
  smokeList = [];
  layoverList = [];
  vcList= [];
  shakecount = 0;
  gameContainer.x = 20;
  levelupplayed = false;
  blockplaying = false;
  cleanup = false; // indicator for checking if any cleaning up is going on
  busy = true;
  gameContainer.y = 88;

  // building prelude screen
  prelude_sinstart = 0;

  getready = createjs.Sound.play('getready');
  getready.addEventListener("complete", function test(){
    createjs.Sound.play('preludeloop', {loop: -1});
  });

  preludeContainer = new createjs.Container();
  preludeContainer.x = 0;
  preludeContainer.y = 88;
  mainContainer.addChild(preludeContainer);
  prelude_bg = new createjs.Shape();
  prelude_bg.graphics.beginFill('#000').drawRect(0, 0, 640, 720).endFill();
  preludeContainer.addChild(prelude_bg);

  currentWorld = parseInt((currentLevel - 1) / 5);
  levelindicator = new createjs.Text("LEVEL " + (currentWorld + 1)+" - " + (currentLevel - (currentWorld * 5)), "24px Oswald", "#fff");
  levelindicator.x = 320;
  levelindicator.y = 50;
  levelindicator.lineHeight = 40;
  levelindicator.textAlign = "center";
  preludeContainer.addChild(levelindicator);

  goals_title = new createjs.Text("GOALS", "24px Oswald", "#aaa");
  goals_title.x = 320;
  goals_title.y = 120;
  goals_title.lineHeight = 40;
  goals_title.textAlign = "center";
  preludeContainer.addChild(goals_title);

  goals_temp  = "";
  goals_temp += "- You will need a score of at least " + levelProperties[currentLevel - 1][3] + " points to advance\n";
  goals_temp += "- Each group needs to consist of at least " + levelProperties[currentLevel - 1][4] + " similar blocks\n";
  goals = new createjs.Text(goals_temp, "24px Oswald", "#aaa");
  goals.x = 50;
  goals.y = 170;
  goals.lineHeight = 40;
  goals.textAlign = "left";
  preludeContainer.addChild(goals);

  bonus_title = new createjs.Text("BONUS", "24px Oswald", "#aaa");
  bonus_title.x = 320;
  bonus_title.y = 275;
  bonus_title.lineHeight = 40;
  bonus_title.textAlign = "center";
  preludeContainer.addChild(bonus_title);

  // bonus 1 (prelude)
  bonus_temp  = "";
  for(bg = 0; bg < levelProperties[currentLevel - 1][5].length; bg ++){
    bonus_temp += "- Create " + levelProperties[currentLevel - 1][5][bg][0] + " groups of           for an extra " + levelProperties[currentLevel - 1][5][bg][2] + " points\n";
    prelude_sprite = new createjs.Sprite(ss_tiles, "tile" + levelProperties[currentLevel - 1][5][bg][1]);
    prelude_sprite.x = 260;
    prelude_sprite.y = 322 + (bg * 40);
    prelude_sprite.scaleX = prelude_sprite.scaleY = 0.3;
    preludeContainer.addChild(prelude_sprite);
    preludeContainerList.push(prelude_sprite);
  }
  bonus = new createjs.Text(bonus_temp, "24px Oswald", "#aaa");
  bonus.x = 50;
  bonus.y = 325;
  bonus.lineHeight = 40;
  bonus.textAlign = "left";
  preludeContainer.addChild(bonus);
  // bonus 2
  bonus_temp  = "";
  for(bg = 0; bg < levelProperties[currentLevel - 1][6].length; bg ++){
    bonus_temp += "- Create a group of " + levelProperties[currentLevel - 1][6][bg][0] + "            blocks for " + levelProperties[currentLevel - 1][6][bg][2] + " points\n";
    prelude_sprite = new createjs.Sprite(ss_tiles, "tile" + levelProperties[currentLevel - 1][6][bg][1]);
    prelude_sprite.x = 260;
    prelude_sprite.y = 320 + (levelProperties[currentLevel - 1][5].length * 40) + (bg * 40);
    prelude_sprite.scaleX = prelude_sprite.scaleY = 0.3;
    preludeContainer.addChild(prelude_sprite);
    preludeContainerList.push(prelude_sprite);
  }
  // combocounter
  bonus_temp += "- Create a combo bigger than " + biggestCombo + "\n";
  bonus = new createjs.Text(bonus_temp, "24px Oswald", "#aaa");
  bonus.x = 50;
  bonus.y = 322 + (levelProperties[currentLevel - 1][5].length * 40) + (levelProperties[currentLevel - 1][6].length * 40) - 40;
  bonus.lineHeight = 40;
  bonus.textAlign = "left";
  preludeContainer.addChild(bonus);

  // attention (on prelude screen, only first one is shown!)
  att_temp  = "";
  for(bg = 0; bg < 1; bg ++){
    prelude_sprite = new createjs.Sprite(ss_tiles, "tile" + levelProperties[currentLevel - 1][7][bg][0]);
    prelude_sprite.x = 50;
    prelude_sprite.y = 297 + (levelProperties[currentLevel - 1][5].length * 40) + (levelProperties[currentLevel - 1][6].length * 40) + 75;
    prelude_sprite.scaleX = prelude_sprite.scaleY = 0.3;
    preludeContainer.addChild(prelude_sprite);
    preludeContainerList.push(prelude_sprite);
    attention = new createjs.Text(levelProperties[currentLevel - 1][7][bg][1], "24px Oswald", "#aaa");
    attention.x = 85;
    attention.y = 300 + (levelProperties[currentLevel - 1][5].length * 40) + (levelProperties[currentLevel - 1][6].length * 40) + 75;
    attention.lineHeight = 40;
    attention.textAlign = "left";
    preludeContainer.addChild(attention);
  }

  btn_lvlstart_bg = new createjs.Shape();
  btn_lvlstart_bg.graphics.beginFill('#fff').drawRect(240, 539, 140, 60).endFill();
  btn_lvlstart_bg.shadow = new createjs.Shadow("#aaa", 0, 0, 0);
  preludeContainer.addChild(btn_lvlstart_bg);
  btn_lvlstart = new createjs.Text('START', "24px Oswald", "#000");
  btn_lvlstart.lineheight = 24;
  btn_lvlstart.x = 280;
  btn_lvlstart.y = 557;
  preludeContainer.addChild(btn_lvlstart);
  btn_lvlstart_bg.addEventListener("click", function() {

    // the actual buildup of the level happens after the click on the start btn

    levelArray = [[],[],[],[],[],[],[],[]]; // will contain all tiles of the level
    gameContainer.removeAllChildren(); // clean up game container

    // break levelcount (ie 18) up into world-level (ie 3-2)
    currentWorld = parseInt((currentLevel - 1) / 5);
    lvltext.text = (currentWorld + 1) + "-" + (currentLevel - (currentWorld * 5));
    countdown.text = newcountdown = levelProperties[currentLevel - 1][1];

    // build up the level array
    for(r = 0; r < 8; r ++) {
      for(c = 0; c < 8; c ++) {
        createTile(r, c, true, false); // row, column, unique (not more than 2 adjacents), specialtilesallowed (ie rainbow tile)
        levelArray[r].push(sprite);
      }
    }

    redraw(); // reads levelarray and prints the tiles

    introstarted = false; // no longer showing intro
    gamestarted = true; // things are starting at this point
    busy = true; // so the buildup starts
    createjs.Sound.stop(); // prelude loop stops
    if(!musicoff){
      createjs.Sound.play(levelProperties[currentLevel - 1][2], {loop: -1}); // music for this level starts, if enabled
    }
    preludeContainer.removeAllChildren(); // prelude container is cleared
    mainContainer.removeChild(preludeContainer); // and removed from stage

  });

}

function createEndScreen(){

  mainContainer.removeAllChildren(); // lets clear all game related things

  currentLevel = (parseInt((currentLevel - 1) / 5) * 5 ) + 1; // note that the world is not reset, this way. this means 3-5 becomes 3-1, after restarting the game

  // small version of the title
  titlesmall = preload.getResult("titlesmall");
  titlesmall = new createjs.Bitmap(titlesmall);
  titlesmall.x = 185;
  titlesmall.y = 5;
  mainContainer.addChild(titlesmall);

  endtexttemp = "You ran out of time! Your final score is " + score + " points.";
  endtext = new createjs.Text(endtexttemp, "24px Oswald", "#aaa");
  endtext.x = 320;
  endtext.y = 240;
  endtext.lineHeight = 40;
  endtext.textAlign = "center";
  mainContainer.addChild(endtext);
  score = 0; // score is reset

  if(biggestCombo > 0){
    gameover.addEventListener("complete", function test(){
      nr = createjs.Sound.play('newrecord');
      createLayoverText('NEW RECORD');
      nr.addEventListener("complete", function test(){
        newrecordtext = "You have achieved a new record!\n\nBiggest combo: " + biggestCombo;
        newrecordtext = new createjs.Text(newrecordtext, "24px Oswald", "#aaa");
        newrecordtext.x = 320;
        newrecordtext.y = 420;
        newrecordtext.lineHeight = 40;
        newrecordtext.textAlign = "center";
        mainContainer.addChild(newrecordtext);
        biggestCombo = 0; // combo counter is reset
      });
    });
  }

  btn_restart_bg = new createjs.Shape();
  btn_restart_bg.graphics.beginFill('#fff').drawRect(220, 672, 200, 60).endFill();
  btn_restart_bg.shadow = new createjs.Shadow("#aaa", 0, 0, 0);
  mainContainer.addChild(btn_restart_bg);
  btn_restart = new createjs.Text('RESTART GAME', "24px Oswald", "#000");
  btn_restart.lineheight = 24;
  btn_restart.x = 250;
  btn_restart.y = 690;
  mainContainer.addChild(btn_restart);
  btn_restart_bg.addEventListener("click", function(event) {
    if(biggestCombo == 0){
      mainContainer.removeAllChildren();
      createFrontend();
    }
  });

}

// (re)draw the tiles from levelArray
function redraw(){
  gameContainer.removeAllChildren();
  for(r = 0; r < 8; r ++) {
    for(c = 0; c < 8; c ++) {
      gameContainer.addChild(levelArray[r][c]); // add it to stage
    }
  }
}

// creates a single tile. note that it is not added to the container here
function createTile(r, c, unique, specialallowed){

  // set some fallback vars
  specialtile = false;
  pointstile = false;

  if(specialallowed){   // if a special tile is allowed to be generated

    // note there are currently 3 types of special tiles:
    //7: rainbow tile
    //8: brick tile
    //9: point tile (this can be extended with 10, 11 etc)

    for(st = 0; st < levelProperties[currentLevel - 1][8].length; st ++){ // loop to all configured special tiles
      if(eval(levelProperties[currentLevel - 1][8][st][1] == 7) && (parseInt(levelProperties[currentLevel - 1][8][st][0] * Math.random()) == 0)) {
        // rainbow tile configured and random query succesful
        if(canPutTileHere('tile7', r, c, true)) { // the full = true parameter also checks below and to-the-right for matches
          rnd = levelProperties[currentLevel - 1][8][st][1]; // overrule rnd value for the actual tile creation code below
          specialtile = true; // so the regular routine below doesnt kick in
        }
        specialtile = true; // so the regular routine below doesnt kick in
        break; // break the for.. loop since only one tile needed to be generated
      }
      if(eval(levelProperties[currentLevel - 1][8][st][1] == 8) && (parseInt(levelProperties[currentLevel - 1][8][st][0] * Math.random()) == 0)) {
        // brick tile configured and random query succesful
        if(canPutTileHere('tile8', r, c, true)) {
          rnd = levelProperties[currentLevel - 1][8][st][1];
          specialtile = true;
        }
        specialtile = true;
        break;
      }
      if(eval(levelProperties[currentLevel - 1][8][st][1] == 9) && (parseInt(levelProperties[currentLevel - 1][8][st][0] * Math.random()) == 0)) {
        // points tile configured and random query succesful
        temprnd = levelProperties[currentLevel - 1][0][parseInt(levelProperties[currentLevel - 1][0].length * Math.random())]; // this picks a random allowed tile for this level
        if(canPutTileHere('tile' + temprnd, r, c, true)) {
          rnd = temprnd;
          pointstile  = true; // set an extra flag that is used to switch to the spritesheet with the 'point visuals' configured
          specialtile = true;
          break;
        }
      }
    }
  }

  // a special tile was not created, continue creating ordinary tile
  if(!specialtile) {
    tempTileArray = []; // fill up array with all possible tileid's
    for(tta = 0; tta < levelProperties[currentLevel - 1][0].length; tta ++){
      tempTileArray.push(levelProperties[currentLevel - 1][0][tta]);
    }
    rnd = tempTileArray[parseInt(tempTileArray.length * Math.random())]; // takes one of the tileid's and checks if they can be put here without causing adjacents
    // those randomly generated tiles should be unique so they dont form groups by accident // note: this doesnt work 100%, since the function only looks 'back', since it was intended to be used while generating a level, not updating tiles
    if(unique){
      while(!canPutTileHere("tile" + rnd, r, c)){
        rnd = tempTileArray[parseInt(tempTileArray.length * Math.random())];
      }
    }
  }

  // creates a tile with the given properties
  if(pointstile){
    sprite = new createjs.Sprite(ss_tiles2, "tile" + rnd); // advance flag is set, which means this tile visual should 'advance' to the next frame, taken from a 'second spritesheet' (it really is the same, but showing different frame for the tile identifiers)
    sprite.pointstile = true;
  } else {
    sprite = new createjs.Sprite(ss_tiles, "tile" + rnd);
    sprite.pointstile = false;
  }
  sprite.x = c * res;
  sprite.c = c;
  sprite.r = r;
  sprite.checked = false;


  if(rnd != 8){ // you can not remove tile8
    sprite.addEventListener("click", function(event) {
      if(!checkingAdjacents && !checkingMovements && !busy){
        handleClick(event.target);
      }
    });
  } else {

    sprite.addEventListener("click", function(event) {
      if(!checkingAdjacents && !checkingMovements && !busy){
        hitwall = createjs.Sound.play('hitwall');
      }
    });
  }
}

// helper function to prevent adjacents (>2) when generating a level (will return false if 2 similar tiles in vicinity, or one rainbow tile)
function canPutTileHere(spriteid, r, c, full) {

  // note that tile7 is also a valid tile to form a combination, since its the rainbow tile. thats why it pops up in adjacent checks like here below

  adjacentCount = 0;

  //check left
  if((c > 0) && (levelArray[r][c - 1]._animation.name == spriteid)) {
    adjacentCount ++; // x - 1
    if((c > 1) && ((levelArray[r][c - 2]._animation.name == spriteid) || levelArray[r][c - 2]._animation.name == 'tile7' || spriteid == 'tile7'  )) {adjacentCount ++} // x - 2
    if((c > 0) && (r > 0) && ((levelArray[r - 1][c - 1]._animation.name == spriteid) || levelArray[r - 1][c - 1]._animation.name == 'tile7' || spriteid == 'tile7'  )) {adjacentCount ++} // x - 1, y - 1
  }

  //check up
  if((r > 0) && (levelArray[r - 1][c]._animation.name == spriteid)) {
    adjacentCount ++; // y - 1
    if((r > 1) && (levelArray[r-2][c]._animation.name == spriteid)) {adjacentCount ++} // y - 2
    if((r > 0) && (c > 0) && ((levelArray[r - 1][c - 1]._animation.name == spriteid) || levelArray[r - 1][c - 1]._animation.name == 'tile7' || spriteid == 'tile7' )) {adjacentCount ++} // y - 1, x - 1
    if((r > 0) && (c < 7) && ((levelArray[r - 1][c + 1]._animation.name == spriteid) || levelArray[r - 1][c + 1]._animation.name == 'tile7' || spriteid == 'tile7' )) {adjacentCount ++} // y - 1 , x + 1
  }

  if(full){
    //check right
    if((c < 6) && (levelArray[r][c + 1]._animation.name == spriteid)) {
      adjacentCount ++; // x + 1
      if((c < 6) && ((levelArray[r][c + 2]._animation.name == spriteid) || levelArray[r][c + 2]._animation.name == 'tile7' || spriteid == 'tile7'  )) {adjacentCount ++} // x + 2
      if((c < 7) && (r > 0) && ((levelArray[r - 1][c + 1]._animation.name == spriteid) || levelArray[r - 1][c + 1]._animation.name == 'tile7' || spriteid == 'tile7'  )) {adjacentCount ++} // x + 1, y - 1
    }

    //check down
    if((r < 7) && (levelArray[r + 1][c]._animation.name == spriteid)) {
      adjacentCount ++; // y + 1
      if((r < 6) && (levelArray[r+2][c]._animation.name == spriteid)) {adjacentCount ++} // y + 2
      if((r < 7) && (c > 0) && ((levelArray[r + 1][c - 1]._animation.name == spriteid) || levelArray[r + 1][c - 1]._animation.name == 'tile7' || spriteid == 'tile7' )) {adjacentCount ++} // y + 1, x - 1
      if((r < 7) && (c < 7) && ((levelArray[r + 1][c + 1]._animation.name == spriteid) || levelArray[r + 1][c + 1]._animation.name == 'tile7' || spriteid == 'tile7' )) {adjacentCount ++} // y + 1 , x + 1
    }

    if(((r < 7) && (r > 0) && (levelArray[r + 1][c]._animation.name == levelArray[r - 1][c]._animation.name))){adjacentCount ++;} // left & right
    if(((c < 7) && (c > 0) && (levelArray[r][c + 1]._animation.name == levelArray[r][c - 1]._animation.name))){adjacentCount ++;} // up & down

  }

  if(adjacentCount >= 2){return false} else {return true}

}

// recursive function that puts all adjacent tiles in resultArray
function findNeighbours(r, c, t){

  // note that tile7 is also a valid tile to form a combination, since its the rainbow tile. thats why it pops up in adjacent checks like here below

  // right
  if(c + 1 < levelArray[r].length && (levelArray[r][c + 1]._animation.name == t || levelArray[r][c+1]._animation.name == 'tile7') && levelArray[r][c + 1].checked == false) { // if the given value c+1 is smaller than the length of the current r(ow), and on that c+1 position a tile is matching the given one
    if(!findIn2dArray([r, c, t],resultArray)){resultArray.push([r, c, t]);} // first add the original tile that was used for comparing to the array (irst check to see if it isnt in there already)
    if(!findIn2dArray([r, c + 1, t],resultArray)){resultArray.push([r, c + 1, t]);} // then add the newly found tile to it (first check to see if it isnt in there already)
    levelArray[r][c].checked = true; // without this, the routine would keep pingponging between 2 tiles, since they keep matching with each other
    findNeighbours(r, c + 1, t); // call the function from itself (recursion) to find new matching tiles and keep adding those to the array aswell
  }

  // left
  if(c - 1 >= 0 && (levelArray[r][c - 1]._animation.name == t || levelArray[r][c - 1]._animation.name == 'tile7') && levelArray[r][c - 1].checked == false) {
    if(!findIn2dArray([r, c, t],resultArray)){resultArray.push([r, c, t]);}
    if(!findIn2dArray([r, c - 1, t],resultArray)){resultArray.push([r, c - 1, t]);}
    levelArray[r][c].checked = true;
    findNeighbours(r, c - 1, t);
  }

  // above
  if(r - 1 >= 0 && (levelArray[r - 1][c]._animation.name == t || levelArray[r - 1][c]._animation.name == 'tile7') && levelArray[r - 1][c].checked == false) {
    if(!findIn2dArray([r, c, t],resultArray)){resultArray.push([r, c, t]);}
    if(!findIn2dArray([r - 1, c, t],resultArray)){resultArray.push([r - 1, c, t]);}
    levelArray[r][c].checked = true;
    findNeighbours(r - 1, c, t);
  }

  // below
  if(r + 1 < levelArray.length && (levelArray[r + 1][c]._animation.name == t || levelArray[r + 1][c]._animation.name == 'tile7') && levelArray[r + 1][c].checked == false) {
    if(!findIn2dArray([r, c, t],resultArray)){resultArray.push([r, c, t]);}
    if(!findIn2dArray([r + 1, c, t],resultArray)){resultArray.push([r + 1, c, t]);}
    levelArray[r][c].checked = true;
    findNeighbours(r + 1, c, t);
  }

}

// little helper function to check if a to-be-added tile already exists in resultArray. If so, return true so it's not added again (that would give false result count)
function findIn2dArray(query, array){
  for(a = 0; a < array.length; a ++){
    if(
      array[a][0] == query[0] &&
        array[a][1] == query[1] &&
        array[a][2] == query[2]
      ){
      return true;
    }
  }
  return false;
}

// checks and (re)moves adjacent tiles
function checkAdjacents() {

  for(d = 0; d < levelArray.length; d ++){
    for(e = 0; e < levelArray[d].length; e ++){
      levelArray[d][e].checked = false; // this tile is now ready to be checked for adjacents, again
    }
  }

  result = false; // reset results after each iteration

  // now loop through each entry in levelArray to do the checking
  for(d = 0; d < levelArray.length; d ++){
    for(e = 0; e < levelArray[d].length; e ++){

      resultArray = []; // each tile generates a new array of similar adjacent tiles

      // if it hasnt been adjacent to some previously checked tile
      if(levelArray[d][e].checked != true){

        r = levelArray[d][e].r;
        c = levelArray[d][e].c;
        t = levelArray[d][e]._animation.name;

        if(r, c, t){
          findNeighbours(r, c, t); // builds up resultArray with adjacents
        }

        if(resultArray.length >= levelProperties[currentLevel - 1][4]){

          // the minimum amount of blocks for a group for this level has been reached

          // generate white tiles on the exact adjacent tile spots
          for(vc = 0; vc < resultArray.length; vc ++){
            vcshape = new createjs.Shape();
            color = "#ffffff"; // displays white highlight over eliminated tiles
            vcshape.graphics.beginFill(color).drawRect((resultArray[vc][1] + 0.26) * res, (resultArray[vc][0] + 1.17) * res, res, res).endFill();
            mainContainer.addChild(vcshape);
            vcList.push(vcshape);
          }

          // loop through list of goals for this level and check if goal tile matches the one that is now being eliminated
          for(bg = 0; bg < levelProperties[currentLevel - 1][5].length; bg ++){
            if(('tile' + levelProperties[currentLevel - 1][5][bg][1]) == resultArray[0][2]){
              // a group is eliminated that was part of the 'group' goals
              for(lom = 0; lom < bonusContainerList.length; lom ++){
                // loop through list of score counters (bottom of game screen) to find the one that needs updating, and subtract 1
                if( ('tile' + bonusContainerList[lom].tileid) == resultArray[0][2]){
                  if(bonusContainerList[lom].text > 0){
                    bonusContainerList[lom].text --;
                    if(bonusContainerList[lom].text == 0){
                      // goal reached
                      newcountdown += levelProperties[currentLevel - 1][5][bg][2];
                      score += levelProperties[currentLevel - 1][5][bg][2];
                      if(!bonussoundplaying){
                        bonussoundplaying = true;
                        bonussound = createjs.Sound.play('extrapoints');
                        bonussound.addEventListener("complete", function test(){bonussoundplaying = false});
                      }
                    }
                  }
                }
              }

            }
          }

          // loop through list of goals for this level and check if goal tile matches the one that is now being eliminated
          for(bg = 0; bg < levelProperties[currentLevel - 1][6].length; bg ++){
            if((('tile' + levelProperties[currentLevel - 1][6][bg][1]) == resultArray[0][2]) && (resultArray.length >= levelProperties[currentLevel - 1][6][bg][0])){
              // a group is eliminated that was part of the 'count' goals
              newcountdown += levelProperties[currentLevel - 1][6][bg][2];
              score += levelProperties[currentLevel - 1][6][bg][2];
              if(!bonussoundplaying){
                bonussoundplaying = true;
                bonussound = createjs.Sound.play('extrapoints');
                bonussound.addEventListener("complete", function test(){bonussoundplaying = false});
              }
            }
          }

          // if user decides to make a combo of special tiles, they deserve some extra points
          for(st=0; st<levelProperties[currentLevel - 1][8].length; st++){
            if(('tile'+levelProperties[currentLevel - 1][8][st][1]) == resultArray[0][2]){
              //a group of special tiles is eliminated, with the id levelProperties[currentLevel - 1][8][st][1]
              newcountdown += resultArray.length * 100;
              score += resultArray.length * 100;
              if(!bonussoundplaying){
                bonussoundplaying = true;
                bonussound = createjs.Sound.play('extrapoints');
                bonussound.addEventListener("complete", function test(){bonussoundplaying = false});
              }
            }
          }


          // if a pointstile is included, loop through the list and add points for each of them
          for(z = 0; z < resultArray.length; z ++){
            rr = resultArray[z][0];
            cc = resultArray[z][1];
            if(levelArray[rr][cc].pointstile){
              // found one! add points and play sample
              newcountdown += 100;
              score += 100;
              if(!bonussoundplaying){
                bonussoundplaying = true;
                bonussound = createjs.Sound.play('extrapoints');
                bonussound.addEventListener("complete", function test(){bonussoundplaying = false});
              }
            }
          }

          result = true;
          scoretemp = parseInt((resultArray.length * resultArray.length)); // score is increased by the count of combos multiplied by each other
          newcountdown += scoretemp;
          score += scoretemp;

          // sort resultArray top-down, thats the order in which the tiles are replaced
          resultArray2 = resultArray.sort(function(a,b) {
            return a[0] > b[0];
          });
          resultArray = resultArray2;

          // loop through each entry in the resultarray
          for(z = 0; z < resultArray.length; z ++){

            r = resultArray[z][0];
            c = resultArray[z][1];
            t = resultArray[z][2];
            a = r;

            createShards(r, c, t);

            // EACH entry in the resultarray, ABOVE the one that needs to be removed, HAS to move down one spot. And with that I mean both in levelArray and visually. LevelArray is done here, visual part is done by handleTick (remember: you cannot just adjust their r-value, then the levelArray would be totally mixed up! instead, move each entry down in a copy process)
            while(a > 0){ // by setting a to r at the start, it is safe to move back until zero is encountered
              oldr = levelArray[a - 1][c].r;
              levelArray[a][c] = levelArray[a - 1][c]; // see? each entry gets the data from the one above.
              levelArray[a][c].r = a; // however, do adjust their r-value. (no, not y. that is handled by handleTick, remember?)
              a --;
            }

            // now the adjacent tiles group is totally replaced by the tiles above them. but where do the new entries come from? well..
            createTile(0, c, true, true); // ..at the top, ofcourse. here special tiles are allowed to be created (last parameter)
            levelArray[0][c] = sprite; // the levelarray has no gaps, but at the top, the end of the copy routine, 2 tiles are now similar (due to the copying). replace the top one with something new
          }

          // score coins are treated as shards, too
          add = 20 + (10 * Math.random());
          xx = ( c + 0.5 + (Math.random()     )) * res;
          yy = ( r + 1.5 + (Math.random() / 2) ) * res;
          rot = 20 - (40 * Math.random());
          shard_bg = new createjs.Shape();
          shard_bg.graphics.setStrokeStyle(2, "round").beginStroke("#ae7e21").beginFill('#fff21f').drawCircle(7, 5, 10).closePath();
          shard_bg.shadow = new createjs.Shadow("#aaa", 0, 0, 0);
          shard_bg.x = xx;
          shard_bg.y = yy;
          shard_bg.rotation = rot;
          shard_bg.yadd = add;
          shard_bg.coin = true;
          mainContainer.addChild(shard_bg);
          shardList.push(shard_bg);
          shard = new createjs.Text(scoretemp, "bold 11px Arial", "#714d0e");
          shard.x = xx;
          shard.y = yy;
          shard.rotation = rot;
          shard.yadd = add;
          shard.coin = true;
          mainContainer.addChild(shard);
          shardList.push(shard);
          if(!pingplaying){
            pingplaying = true;
            ping = createjs.Sound.play('ping');
            ping.addEventListener("complete", function test(){pingplaying = false}); // ensures only one ping is played
          }

          combocounter ++;

          redraw(); // redraw level

          if(newcountdown >= levelProperties[currentLevel - 1][3]){
            // new score is >= minimum and cleanup is not set
            cleanup = true; // set the cleanup flag so user interaction is no longer possible and things are paused until they are cleaned up (ie movement, adjacent checks, arraylist depletion)
          }

        }

      }

    }
  }

  return result;

}

// creates the textual representation of the speech
function createLayoverText(text){
  layover = new createjs.Text(text, "bold 45px 'Erica One'", "#fff");
  layover.x = 320 - layover.getMeasuredWidth() / 2;
  layover.y = 331;
  layover.alpha = 5;
  layover.shadow = new createjs.Shadow("#000", 0, 0, 15);
  mainContainer.addChild(layover);
  layoverList.push(layover);
}

// each destroyed tile has shards jumping off to indicate an explosion
function createShards(r, c, t){
  for(s = 0; s < 4; s ++){
    shard = new createjs.Sprite(ss_shards, t);
    shard.x = ( c + 0.3 + (Math.random()     )) * res;
    shard.y = 20 + (( r + 1.5 + (Math.random() / 2) ) * res);
    shard.rotation = 360 * Math.random();
    shard.yadd = 10 + (10 * Math.random());
    mainContainer.addChild(shard);
    shardList.push(shard);
  }
}

// creates the smoke effect as seen in the shakeDown routine
function createSmoke(){
  for(z = 0; z < 15; z ++){
    smoke = new createjs.Shape();
    smoke.graphics.beginFill(createjs.Graphics.getRGB(225, 225, 225)).drawCircle(0, 0, 10 * Math.random() + 50).closePath();
    smoke.alpha = 0.5 * Math.random();
    smoke.x = 20 + (600 * Math.random());
    smoke.y = 660 + (40 * Math.random());
    smoke.scaleX = smoke.scaleY =  scaleY = (50 * Math.random() + 20) / 100;
    mainContainer.addChild(smoke);
    smokeList.push(smoke);
  }
}

function createEnding() {

  endstarted = true;

  mainContainer.removeAllChildren();

  rick = createjs.Sound.play('rick', {loop: -1});

  gameContainer = new createjs.Container();
  gameContainer.x = 20;
  gameContainer.y = 88;
  mainContainer.addChild(gameContainer);

  scrollContainer = new createjs.Container();
  scrollContainer.x = 0;
  scrollContainer.y = 550;
  scrollContainer.glow = 0;
  gameContainer.addChild(scrollContainer);

  endgametext = new createjs.Text("CONGRATULATIONS!", "bold 30px Inconsolata", "#aaa");
  endgametext.x = 185;
  endgametext.y = 200;
  scrollContainer.addChild(endgametext);

  endgametext = new createjs.Text("YOUR FINAL SCORE IS "+score, "bold 30px Inconsolata", "#aaa");
  endgametext.x = 125;
  endgametext.y = 280;
  scrollContainer.addChild(endgametext);

  endgametext = new createjs.Text("" +
    "WOW, YOU HAVE ACTUALLY COMPLETED THIS\n" +
    "GAME.I SURE HOPE YOU HAD FUN PLAYING\n" +
    "IT, ALTHOUGH I CANT REALLY IMAGINE :)\n\n" +
    "SOME QUICK CREDITS:\n" +
    "ALL CODE & GRAPHICS BY ME, RVO\n" +
    "MUSIC TAKEN FROM NOSOAPRADIO, FLASHKIT\n" +
    "WRATHGAMES.COM, AND A C64 DEMO BY CREST\n" +
    "SPEECH SAMPLES COME FROM ODDCAST.COM\n\n" +
    "SEE YOU IN MY NEXT PROD!" +
    "", "bold 30px Inconsolata", "#aaa");
  endgametext.x = 300;
  endgametext.y = 340;
  endgametext.lineHeight = 40;
  endgametext.textAlign = "center";
  scrollContainer.addChild(endgametext);

  // small version of the title
  titlesmall_bg = new createjs.Shape();
  titlesmall_bg.graphics.beginFill('#000').drawRect(0, 0, 640, 75).endFill();
  mainContainer.addChild(titlesmall_bg);
  titlesmall = preload.getResult("titlesmall");
  titlesmall = new createjs.Bitmap(titlesmall);
  titlesmall.x = 185;
  titlesmall.y = 7;
  mainContainer.addChild(titlesmall);


}

function handleShakeDown() {

  busy = true;

  if(!levelupplayed){
    createjs.Sound.setVolume(1);
    lvlup = createjs.Sound.play('levelup');
    createLayoverText('LEVEL UP');
    levelupplayed = true;
  }

  if(gameContainer.y < 580){
    r = 7;
    c = 7 * Math.random();
    t = "tile" + parseInt(levelProperties[currentLevel - 1][0].length * Math.random()); // random per level tiles possible
    createShards(r, c, t);
    createSmoke();
  }

  if(smokeList.length > 0){
    for(sl = 0; sl < smokeList.length; sl ++){
      if(smokeList[sl].alpha > 0){
        smokeList[sl].scaleX = smokeList[sl].scaleY -= 0.001;
        smokeList[sl].alpha -= smokeList[sl].scaleX / 25;
      }
      else {
        mainContainer.removeChild(smokeList[sl]);
        smokeList.splice(sl, 0);
      }
    }
  }

  if(gameContainer.y < 1000){
    gameContainer.y += 5;
  } else {
    shakeDown = false;
    if(parseInt((currentLevel - 1) / 5) < parseInt((currentLevel) / 5)){
      biggestCombo = 0; // resetting combo record for each new world
    }
    if(currentLevel == 25 && gamestarted){
      gamestarted = false;
      createEnding();
    } else {
      currentLevel ++;
      createLevel();
    }
  }

  if(bonusContainer.alpha > 0){
    bonusContainer.alpha -= 0.05;
  }

}

function handleShards() {


  for(sl=0; sl<shardList.length; sl ++){
    if( (shardList[sl].y) <= 1000){

      if(shardList[sl].yadd > - 25){
        shardList[sl].yadd -= 2;
      }

      shardList[sl].y -= shardList[sl].yadd;

      if(!shardList[sl].coin){
        if(shardList[sl].rotation > 180){
          shardList[sl].x += (1000 - shardList[sl].y) / 100;
          shardList[sl].rotation += (10 + shardList[sl].rotation) / 50;
        } else {
          shardList[sl].x -= (1000 - shardList[sl].y) / 100;
          shardList[sl].rotation -= (10 + shardList[sl].rotation) / 50;
        }
      } else {
        // x translation of the coins
        if(shardList[sl].rotation > 0){
          shardList[sl].x += (1000 - shardList[sl].y) / 100;
        } else {
          shardList[sl].x -= (1000 - shardList[sl].y) / 100;
        }
      }


    } else {
      mainContainer.removeChild(shardList[sl]);
      shardList.splice(sl, 1);
    }
  }

}


function handleEnd() {

  // move scroll text
  scrollContainer.y -= 2;

  if(scrollContainer.y < -800){
    thatsall = preload.getResult("thatsall");
    thatsall = new createjs.Bitmap(thatsall);
    thatsall.x = 55;
    thatsall.y = 200;
    mainContainer.addChild(thatsall);
    scrollContainer.y = 50000; // bye bye
    thatsall.addEventListener("click", function(event) {
      createjs.Sound.stop();
      mainContainer.removeAllChildren();
      endstarted = false;
      createFrontend();
    });
  }

}


function handleVc() {
  for(vc = 0; vc<vcList.length; vc ++){
    if((vcList[vc].alpha) > 0){
      vcList[vc].alpha -= 0.1;
    } else {
      mainContainer.removeChild(vcList[vc]);
      vcList.splice(vc, 1);
    }
  }
}

function handleIntro(){

  btn_start_bg.shadow.blur = 20 + (5 * Math.sin(sprite.sin));

  if(sprite2.x > 800) {introspriteadd = -10; sprite.x =  700;  sprite2.x =  800; sprite3.x = sprite2.x + 160;}
  if(sprite2.x < -310){introspriteadd =  10; sprite.x =- 210;  sprite2.x = -310; sprite3.x = sprite2.x - 180;}

  sprite.x   += introspriteadd;
  sprite2.x  += introspriteadd;
  sprite3.x  += introspriteadd + 1;

  sprite.y = sprite.starty + (10 * Math.sin(sprite.sin));
  sprite.sin += 0.4;

  sprite2.y = sprite2.starty + (10 * Math.sin(sprite2.sin));
  sprite2.sin += 0.4;

}

function handleOverlays() {
  for(lol = 0; lol < layoverList.length; lol ++){
    if((layoverList[lol].alpha) > 0){
      layoverList[lol].alpha -= 0.1;
    } else {
      mainContainer.removeChild(layoverList[lol]);
      layoverList.splice(lol, 1);
    }
  }
}

function handleScreenShake(){
  gameContainer.x = 20 + (3 * Math.sin(shakecount));
  shakecount -= 0.7;
  if(shakecount < 0.1){shakecount = 0; gameContainer.x = 20;}
}


// handles keypress
function handleKeyDown(e) {
  if(gamestarted || introstarted){
    switch(e.keyCode) {
      case KEYCODE_M: createjs.Sound.stop(); musicoff = true; break;
      case KEYCODE_D: debug = true; break;
    }
  }
}

// handles mouseclick / touch
function handleClick(target){

  busy = true;

  // lets use the same abbr as previously
  r = target.r;
  c = target.c;
  t = target._animation.name;

  createShards(r,c,t);

  // change levelarray to reflect the coming change (dont remove anything. that will destroy your array logic)
  a = r;
  while(a > 0){
    levelArray[a][c]   = levelArray[a - 1][c];
    levelArray[a][c].r = levelArray[a][c].r + 1;
    a --;
  }

  // insert a new tile in the open position (not where user clicked, but on r=0, c=c!)
  createTile(0, c, true, true); // also allow special tiles to be used here
  gameContainer.addChild(sprite);
  levelArray[0][c] = sprite;

  // timer penalty
  newcountdown -= 10;

  redraw(); //redraw level according to updated levelarray

}

function handleTick() {

  if(gamestarted){

    // handle shards movement
    if(shardList.length > 0){
      handleShards();
    }

    // handle overlays for successful matches (debug)
    if(vcList.length > 0){
      handleVc();
    }

    if(busy && !shakeDown){
      // checking for tiles that have an y that doesnt match their 'r' value
      checkingMovements = false;
      for(a = 0; a < levelArray.length; a ++){
        for(b = 0; b < levelArray.length; b ++){
          if((levelArray[a][b].r * res) != levelArray[a][b].y){
            levelArray[a][b].y += 25; // moving tile down
            checkingMovements = true;
            busy = true;
          }
        }
      }
      if(!checkingMovements){
        if(newcountdown < levelProperties[currentLevel-1][3]){
          if(!blockplaying){
            blockplaying = true;
            block = createjs.Sound.play('block');
            block.addEventListener("complete", function test(){blockplaying = false});
          }
        }
        // didnt move anything, lets check adjacents
        if(checkAdjacents()){
          busy = true;
          while(checkAdjacents() == true){
            checkAdjacents();
          }
        } else {
          busy = false; // didnt find any adjacents, and since movement was also not needed, this iteration is completed

          if(combocounter > 1 && shakecount < 1){
            if(combocounter == 2 && shakecount < 1){if(!bonussoundplaying){sample = createjs.Sound.play('combo')}createLayoverText('COMBO');}
            if(combocounter == 3 && shakecount < 1){if(!bonussoundplaying){sample = createjs.Sound.play('triplecombo')}createLayoverText('TRIPLE COMBO');}
            if(combocounter == 4 && shakecount < 1){if(!bonussoundplaying){sample = createjs.Sound.play('quadcombo')}createLayoverText('QUAD COMBO');}
            if(combocounter > 4){
              if(!bonussoundplaying){sample = createjs.Sound.play('megacombo')}
              createLayoverText('MEGA COMBO');
              createjs.Sound.play('bigblock');
              if(shakecount == 0){
                shakecount = 30;

                navigator.vibrate = (navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate);
                if (navigator.vibrate) {
                  window.navigator.vibrate(200);  // phone vibration only supported in mobile browsers other than safari.
                }

              }}

            if(combocounter > biggestCombo) {
              biggestCombo = combocounter;

              if(!bonussoundplaying){
                sample.addEventListener("complete", function test(){
                  createjs.Sound.play('newrecord');
                });
              }

            }

            combocounter = 0;
          }

          if(cleanup){
            // cleanup has been called, thus player is moving to next level. locking scores. locking clicks.
            busy = true; // permanently set busy flag so code can finish some things
            // need to finish various movements so we're staying in here..
            ti = createjs.Sound.getVolume();
            if(ti > 0){
              createjs.Sound.setVolume(ti - 0.05); // ..while in this loop fade out all sound aswell
            }
            if(shardList.length == 0 && scoregfxList.length == 0 && shakecount == 0){ // all movements are complete, time to end this level for good
              cleanup = false; // makes sure this bit is only called once
              createjs.Sound.stop();
              createjs.Sound.setVolume(1);
              createjs.Sound.play('collapse');
              shakecount = 100; // needed for screen shakedown
              shakeDown = true; // initialise said shakedown
            }
          }

        }
      }
    }

    // handle screen falling down
    if(shakeDown){
      handleShakeDown();
    }

    // checking score
    if(countdown.text != newcountdown && countdown.text < eval(levelProperties[currentLevel - 1][3]) && gamestarted){
      countdown.text = newcountdown;
    }
    if(newcountdown <= 0 || countdown.text <= 0){ // lower than 0?
      createjs.Sound.stop();
      countdown.text = newcountdown = 0;
      gameover = createjs.Sound.play('gameover');
      createLayoverText('GAME OVER');
      busy = true; // lock mouse clicks
      gamestarted = false;
      createEndScreen();
    }

    // handle countdown depletion
    if (typeof oldtime != 'undefined'){
      if(createjs.Ticker.getTime() - 1000 > oldtime && countdown.text < eval(levelProperties[currentLevel - 1][3]) && gamestarted){
        oldtime = createjs.Ticker.getTime();
        newcountdown --;
      }
    } else {
      oldtime = createjs.Ticker.getTime();
    }

  }

  // the intro animation
  if(introstarted){
    handleIntro();
  }

  // the end scroller etc
  if (endstarted) {
    handleEnd();
  }

  // handle screen shake
  if(shakecount > 0){
    handleScreenShake();
  }

  // handle text overlays
  if(layoverList.length > 0 && gamestarted){
    handleOverlays();
  }

  // show fps
  if(debug){fps.text = Math.round(createjs.Ticker.getMeasuredFPS())}

  // and ofcourse..
  stage.update();

}
