<script lang="ts">
  import Player from "./Player.svelte";
  import { onMount } from "svelte";
  import {
    b2Vec2,
    b2World,
    b2PolygonShape,
    b2CircleShape,
    b2Contact,
    b2ChainShape,
    b2FixtureDef,
    b2BodyDef,
    b2ContactListener,
    b2BodyType,
    b2Body,
  } from "@flyover/box2d";

  const CONTROLS = [
    { left: "q", jump: "z", right: "d" },
    { left: "ArrowLeft", jump: "ArrowUp", right: "ArrowRight" },
  ];
  const SCREEN_WIDTH = 0.9 * window.innerWidth;
  const SCREEN_HEIGHT = 0.9 * window.innerHeight;
  const SCORE_PADDING = 50;
  const GROUND_WIDTH = 30;
  const WIDTH = 40;
  const PLAYER_RADIUS = 1.8;
  const PLAYER_SPEED = 30 / 3.6;
  const PLAYER_ACCEL_DURATION = 30 / 3.6;
  const PLAYER_CHAIN_SIZE = 20;
  const JUMP_HEIGHT = 1.5;
  const BALL_RADIUS = 0.3;
  const BALL_DAMPING = 0.4;
  const BALL_RESTITUTION = 0.8;
  const NET_HEIGHT = PLAYER_RADIUS;
  const GROUND_THICKNESS = 0.1;
  const NET_THICKNESS = 0.15;
  const PLAYER_STARTING_POS = (0.8 * GROUND_WIDTH) / 2;
  const BALL_STARTING_POS = {
    x: PLAYER_STARTING_POS,
    y: 5,
    vy: 5,
  };
  const GRAVITY = 10;
  const PHYSICS = {
    timeStep: 1 / 60,
    velocityIterations: 6,
    positionIterations: 2,
  };
  interface PlayerInput {
    jump: boolean;
    dir: -1 | 0 | 1;
  }
  const playerInputs: PlayerInput[] = [
    { jump: false, dir: 0 },
    { jump: false, dir: 0 },
  ];

  const gravity = new b2Vec2(0, -GRAVITY);
  const world = new b2World(gravity);
  {
    const groundDef = new b2BodyDef();
    groundDef.position.Set(0, -GROUND_THICKNESS / 2);
    groundDef.userData = { kind: "GROUND" };
    const ground = world.CreateBody(groundDef);
    // Define the ground box shape.
    const groundBox = new b2PolygonShape();
    // The extents are the half-widths of the box.
    groundBox.SetAsBox(WIDTH * 5, GROUND_THICKNESS / 2);
    // Add the ground fixture to the ground body.
    ground.CreateFixture(groundBox, 0);
  }

  const reset = function (playerServe: number) {
    playerTouchedLast = playerServe;
    players[0].SetPositionXY(-PLAYER_STARTING_POS, 0);
    players[1].SetPositionXY(PLAYER_STARTING_POS, 0);
    ballBody.SetAngularVelocity(0);
    ballBody.SetLinearVelocity({ x: 0, y: BALL_STARTING_POS.vy });
    ballBody.SetPositionXY(
      (playerServe ? 1 : -1) * BALL_STARTING_POS.x,
      BALL_STARTING_POS.y
    );
    pause = false;
  };

  const handleKeyUp = function (event: KeyboardEvent) {
    for (let p = 0; p < 2; p++) {
      if (event.key == CONTROLS[p].jump) {
        playerInputs[p].jump = false;
      }
      if (event.key == CONTROLS[p].left || event.key == CONTROLS[p].right) {
        playerInputs[p].dir = 0;
      }
    }
  };
  const handleKeydown = function (event: KeyboardEvent) {
    for (let p = 0; p < 2; p++) {
      if (event.key == CONTROLS[p].jump) {
        playerInputs[p].jump = true;
      }
      if (event.key == CONTROLS[p].left) {
        playerInputs[p].dir = -1;
      }
      if (event.key == CONTROLS[p].right) {
        playerInputs[p].dir = 1;
      }
    }
    if (event.key == "r") {
      score = [0, 0];
      reset(Math.round(Math.random()));
    }
    if (event.key == "p") {
      pause = !pause;
    }
  };

  let ballBody: b2Body;
  {
    const ballDef = new b2BodyDef();
    ballDef.type = b2BodyType.b2_dynamicBody;
    ballDef.position.Set(BALL_STARTING_POS.x, BALL_STARTING_POS.y);
    ballDef.userData = { kind: "BALL" };
    ballDef.linearDamping = BALL_DAMPING;
    ballBody = world.CreateBody(ballDef);
    const ballShape = new b2CircleShape();
    ballShape.Set({ x: 0, y: 0 }, BALL_RADIUS);
    const ballFixtureDef = new b2FixtureDef();
    ballFixtureDef.shape = ballShape;
    ballFixtureDef.density = 1;
    ballFixtureDef.restitution = BALL_RESTITUTION;
    ballFixtureDef.friction = BALL_RESTITUTION;
    ballBody.CreateFixture(ballFixtureDef);
  }

  {
    const netDef = new b2BodyDef();
    netDef.position.Set(0, NET_HEIGHT / 2);
    const netBody = world.CreateBody(netDef);
    const netShape = new b2PolygonShape();
    netShape.SetAsBox(NET_THICKNESS / 2, NET_HEIGHT / 2);
    const netFixtureDef = new b2FixtureDef();
    netFixtureDef.shape = netShape;
    netFixtureDef.restitution = BALL_RESTITUTION;
    netFixtureDef.friction = BALL_RESTITUTION;
    netBody.CreateFixture(netFixtureDef);
  }

  function makePlayer(startX: number, playerIndex: number) {
    const playerDef = new b2BodyDef();
    playerDef.type = b2BodyType.b2_kinematicBody;
    playerDef.position.Set(startX, 0);
    playerDef.userData = { kind: "PLAYER", playerIndex: playerIndex };
    const playerBody = world.CreateBody(playerDef);
    const playerShape = new b2ChainShape();
    const playerPoints = [];
    for (let p = 0; p < PLAYER_CHAIN_SIZE; p++) {
      const angle = Math.PI * (1 - p / (PLAYER_CHAIN_SIZE - 1));
      playerPoints.push({
        x: Math.cos(angle) * PLAYER_RADIUS,
        y: Math.sin(angle) * PLAYER_RADIUS,
      });
    }
    playerShape.CreateLoop(playerPoints);
    const playerFixtureDef = new b2FixtureDef();
    playerFixtureDef.shape = playerShape;
    playerFixtureDef.density = 1;
    playerFixtureDef.restitution = BALL_RESTITUTION;
    playerBody.CreateFixture(playerFixtureDef);
    return playerBody;
  }

  let players = [
    makePlayer(-PLAYER_STARTING_POS, 0),
    makePlayer(PLAYER_STARTING_POS, 1),
  ];

  interface AnnotatedBody extends Omit<b2Body, "m_userData"> {
    m_userData: null | {
      kind?: "BALL" | "GROUND" | "PLAYER";
      playerIndex?: number;
    };
  }
  let playerTouchedLast = 0;
  let resetNext: null | number = Math.round(Math.random());
  let score = [0, 0];
  class MyListener extends b2ContactListener {
    override BeginContact(contact: b2Contact): void {
      const bodies: AnnotatedBody[] = [
        contact.m_fixtureA.m_body,
        contact.m_fixtureB.m_body,
      ];
      const player = bodies.find((b) => b.m_userData?.kind == "PLAYER");
      const ball = bodies.find((b) => b.m_userData?.kind == "BALL");
      const ground = bodies.find((b) => b.m_userData?.kind == "GROUND");

      if (player && ball) {
        playerTouchedLast = player.m_userData!.playerIndex!;
      }
      if (ball && ground) {
        const fallenSide = ballBody.GetPosition().x > 0 ? 1 : 0;
        const isFaute = Math.abs(ballBody.GetPosition().x) > GROUND_WIDTH / 2;
        const playerWins = isFaute ? 1 - playerTouchedLast : 1 - fallenSide;
        score[playerWins]++;
        resetNext = 1 - playerWins;
      }
    }
  }
  world.SetContactListener(new MyListener());
  let pause = false;

  let lastPhysics = performance.now() / 1000;
  const playerMinX = PLAYER_RADIUS + NET_THICKNESS / 2;
  function applyPlayerSpeed(index: number) {
    const p = players[index];
    const side = index == 0 ? -1 : 1;
    let vx: number;
    let vy: number;
    let px: number | null = null;
    let py: number | null = null;
    if (p.GetPosition().x * side < playerMinX) {
      vx = 0;
      px = playerMinX * side;
    } else {
      vx = playerInputs[index].dir * PLAYER_SPEED;
    }
    if (p.GetPosition().y < 0) {
      py = 0;
    }
    if (p.GetPosition().y <= 0) {
      vy = playerInputs[index].jump ? Math.sqrt(2 * GRAVITY * JUMP_HEIGHT) : 0;
    } else {
      vy = p.GetLinearVelocity().y - PHYSICS.timeStep * GRAVITY;
    }
    if (px !== null || py !== null) {
      const prevPos = p.GetPosition();
      p.SetPosition({
        x: px !== null ? px : prevPos.x,
        y: py !== null ? py : prevPos.y,
      });
    }
    p.SetLinearVelocity({ x: vx, y: vy });
  }

  function runPhysics() {
    const steps = Math.floor(
      (performance.now() / 1000 - lastPhysics) / PHYSICS.timeStep
    );
    lastPhysics += steps * PHYSICS.timeStep;
    for (let i = 0; i < steps; i++) {
      applyPlayerSpeed(0);
      applyPlayerSpeed(1);
      world.Step(
        PHYSICS.timeStep,
        PHYSICS.velocityIterations,
        PHYSICS.positionIterations
      );
      // useless assignments to force redraw
      ballBody = ballBody;
      players = players;
    }
  }

  onMount(async () => {
    let loopId = requestAnimationFrame(function update() {
      if (pause) {
        lastPhysics = performance.now() / 1000;
      } else {
        if (resetNext !== null) {
          reset(resetNext);
          resetNext = null;
        }
        runPhysics();
      }
      loopId = requestAnimationFrame(update);
    });
    return () => cancelAnimationFrame(loopId);
  });

  const computePlayerAngle = (playerIndex: number) => {
    const player = players[playerIndex].GetPosition();
    const ballPosition = ballBody.GetPosition();
    const atan =
      player.x == ballPosition.x
        ? 270
        : (180 / Math.PI) *
          Math.atan(-(player.y - ballPosition.y) / (player.x - ballPosition.x));
    const inBack = ballPosition.x < player.x ? 180 : 0;
    return 360 + inBack - atan;
  };
</script>

<svg
  class="game"
  style:width="{SCREEN_WIDTH}px"
  style:height="{SCREEN_HEIGHT}px"
  style:marginLeft="10px"
>
  <g
    transform="
      translate({SCREEN_WIDTH / 2} {SCREEN_HEIGHT})
      scale({SCREEN_WIDTH / WIDTH} {-SCREEN_WIDTH / WIDTH})
      translate(0 {GROUND_THICKNESS})
    "
  >
    <Player
      color="red"
      radius={PLAYER_RADIUS}
      eyeAngle={computePlayerAngle(0)}
      x={players[0].GetPosition().x}
      y={players[0].GetPosition().y}
    />
    <Player
      color="blue"
      radius={PLAYER_RADIUS}
      eyeAngle={computePlayerAngle(1)}
      x={players[1].GetPosition().x}
      y={players[1].GetPosition().y}
    />
    <circle
      fill="yellow"
      cx={ballBody.GetPosition().x}
      cy={ballBody.GetPosition().y}
      r={BALL_RADIUS}
    />
    <rect
      fill="gray"
      width={NET_THICKNESS}
      height={NET_HEIGHT}
      x={-NET_THICKNESS / 2}
      y="0"
    />
    <rect
      fill="gray"
      width={GROUND_WIDTH}
      height={GROUND_THICKNESS}
      x={-GROUND_WIDTH / 2}
      y={-GROUND_THICKNESS}
    />
  </g>
  <style>
    .score {
      font: bold 30px sans-serif;
    }
  </style>
  <text x={SCORE_PADDING} y={SCORE_PADDING} fill="red" class="score"
    >{score[0]}</text
  >
  <text
    x={SCREEN_WIDTH - SCORE_PADDING}
    y={SCORE_PADDING}
    fill="blue"
    class="score">{score[1]}</text
  >
</svg>
<svelte:window on:keydown={handleKeydown} on:keyup={handleKeyUp} />

<style>
  :global(body) {
    background: lightblue;
  }
</style>
