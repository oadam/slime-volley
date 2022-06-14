<script lang="ts">
  import Player from "./Player.svelte";
  import { onMount } from "svelte";
  import {
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    SCORE_PADDING,
    GROUND_WIDTH,
    WIDTH,
    PLAYER_RADIUS,
    PLAYER_SPEED,
    JUMP_HEIGHT,
    BALL_RADIUS,
    NET_HEIGHT,
    GROUND_THICKNESS,
    NET_THICKNESS,
    PLAYER_STARTING_POS,
    BALL_STARTING_POS,
    GRAVITY,
    PHYSICS,
    CONTROLS,
  } from "./Constants";
  import {
    createWorld,
    createBall,
    createPlayer,
    ContactListener,
  } from "./Bodies";

  interface PlayerInput {
    jump: boolean;
    dir: -1 | 0 | 1;
  }
  const playerInputs: PlayerInput[] = [
    { jump: false, dir: 0 },
    { jump: false, dir: 0 },
  ];
  let score = [0, 0];
  let playerTouchedLast = 0;
  let resetNext: number | null = Math.round(Math.random());

  const world = createWorld();
  let ballBody = createBall(world);
  let players = [createPlayer(world, 0), createPlayer(world, 1)];
  world.SetContactListener(
    new ContactListener({
      onBallGround: () => {
        const fallenSide = ballBody.GetPosition().x > 0 ? 1 : 0;
        const isFaute = Math.abs(ballBody.GetPosition().x) > GROUND_WIDTH / 2;
        const playerWins = isFaute ? 1 - playerTouchedLast : 1 - fallenSide;
        score[playerWins]++;
        resetNext = 1 - playerWins;
      },
      onPlayerBall: (playerIndex: number) => {
        playerTouchedLast = playerIndex!;
      },
    })
  );

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
