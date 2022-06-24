<script lang="ts">
  import Player from "./Player.svelte";
  import { onMount } from "svelte";
  import {
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    SCORE_PADDING,
    GROUND_WIDTH,
    AI_SIMUL_COUNT,
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
    b2Vec2,
    XY,
    b2Body,
    b2ContactListener,
    b2Contact,
  } from "@flyover/box2d";
  import {
    createWorld,
    createPlayer,
    getContactBodies,
    BodySnapshot,
  } from "./Bodies";

  const JUMP_SPEED = Math.sqrt(2 * GRAVITY * JUMP_HEIGHT);
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

  let { world, ball } = createWorld();
  let players = [createPlayer(world, 0), createPlayer(world, 1)];

  let simulationGroundContact: XY | undefined;
  const simulWorld = createWorld();
  const simulation = {
    player: createPlayer(simulWorld.world, 0),
    ...createWorld(),
  };
  simulation.world.SetContactListener(
    new (class extends b2ContactListener {
      override BeginContact(contact: b2Contact): void {
        const { ball, ground } = getContactBodies(contact);
        if (ball && ground) {
          simulationGroundContact = ball.GetPosition().Clone();
        }
      }
    })()
  );

  function onBallGround() {
    const fallenSide = ball.GetPosition().x > 0 ? 1 : 0;
    const isFaute = Math.abs(ball.GetPosition().x) > GROUND_WIDTH / 2;
    const playerWins = isFaute ? 1 - playerTouchedLast : 1 - fallenSide;
    score[playerWins]++;
    resetNext = 1 - playerWins;
  }

  // https://stackoverflow.com/a/12646864/436792
  function shuffleArray(array: unknown[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  function adjustSimul() {
    // clone world ball
    const initSnapshot = new BodySnapshot(ball);
    initSnapshot.apply(simulation.ball);

    // move player out of the way
    simulation.player.SetPositionXY(3 * WIDTH, 0);

    let simulSteps = 0;
    let firstReachable: { pos: XY; steps: number } | undefined;
    let lastReachable: typeof firstReachable;
    simulationGroundContact = undefined;
    while (!simulationGroundContact) {
      simulSteps++;
      // avoid inifinite loop
      if (simulSteps * PHYSICS.timeStep > 10) {
        throw new Error("ball did not reach ground in 10 seconds");
      }
      simulation.world.Step(
        PHYSICS.timeStep,
        PHYSICS.velocityIterations,
        PHYSICS.positionIterations
      );
      if (
        !firstReachable &&
        simulation.ball.GetPosition().y < PLAYER_RADIUS + BALL_RADIUS
      ) {
        firstReachable = {
          pos: simulation.ball.GetPosition().Clone(),
          steps: simulSteps,
        };
      }
    }
    if (!firstReachable) {
      throw new Error(
        "ball reach ground without ever reaching reachable height ??"
      );
    }
    lastReachable = {
      pos: simulationGroundContact,
      steps: simulSteps,
    };
    // assume that balls goes straight from firstReachablePos to lastReachablePos
    // try all reachable positions that place the player within a radius of this straight line

    const reachableVec = new b2Vec2(
      firstReachable.pos.x,
      firstReachable.pos.y
    ).SelfSub(lastReachable.pos);

    const JUMP_STEPS = Math.ceil(JUMP_SPEED / GRAVITY / PHYSICS.timeStep);
    const reachableSin = reachableVec.y / reachableVec.Length();
    const dxFirstTouch = Math.abs(PLAYER_RADIUS / reachableSin);
    const DX_TO_STEPS = 1 / PLAYER_SPEED / PHYSICS.timeStep;
    const dxFirstTouchSteps = dxFirstTouch * DX_TO_STEPS;
    const stepsToNet = Math.ceil(-players[0].GetPosition().x * DX_TO_STEPS);
    let candidateMoves: {
      stepsGoingRight: number;
      lastStep: number;
      stepsJumping: number;
    }[] = [];
    for (let stepsJumping = 0; stepsJumping <= JUMP_STEPS; stepsJumping++) {
      const height =
        JUMP_SPEED * stepsJumping * PHYSICS.timeStep -
        (GRAVITY * Math.pow(stepsJumping * PHYSICS.timeStep, 2)) / 2;
      const reachableXAtHeigh =
        lastReachable.pos.x +
        (height / firstReachable.pos.y) *
          (firstReachable.pos.x - lastReachable.pos.x);
      const stepsGoingRightToReachableXAtHeight =
        (reachableXAtHeigh - players[0].GetPosition().x) * DX_TO_STEPS;
      const minStepsGoingRight = Math.max(
        -simulSteps,
        Math.floor(stepsGoingRightToReachableXAtHeight - dxFirstTouchSteps)
      );
      const maxStepsGoingRight = Math.min(
        simulSteps,
        Math.ceil(stepsGoingRightToReachableXAtHeight + dxFirstTouchSteps),
        stepsToNet
      );
      // console.log({ stepsJumping, minStepsGoingRight, maxStepsGoingRight });
      for (
        let stepsGoingRight = minStepsGoingRight;
        stepsGoingRight <= maxStepsGoingRight;
        stepsGoingRight++
      ) {
        for (let lastStep = -1; lastStep <= 1; lastStep++) {
          candidateMoves.push({ stepsGoingRight, lastStep, stepsJumping });
        }
      }
    }
    shuffleArray(candidateMoves);
    console.log(candidateMoves.slice(0, AI_SIMUL_COUNT));
  }

  world.SetContactListener(
    new (class extends b2ContactListener {
      override BeginContact(contact: b2Contact): void {
        const { player, ball, ground } = getContactBodies(contact);
        if (player && ball) {
          playerTouchedLast = player.m_userData!.playerIndex!;
        }
        if (ball && ground) {
          onBallGround();
        }
      }
      override EndContact(contact: b2Contact): void {
        const { player, ball, ground } = getContactBodies(contact);
        if (ball) {
          adjustSimul();
        }
      }
    })()
  );

  const reset = function (playerServe: number) {
    stepsFromStart = 0;
    playerTouchedLast = playerServe;
    players[0].SetPositionXY(-PLAYER_STARTING_POS, 0);
    players[1].SetPositionXY(PLAYER_STARTING_POS, 0);
    ball.SetAngularVelocity(0);
    ball.SetLinearVelocity({ x: 0, y: BALL_STARTING_POS.vy });
    ball.SetPositionXY(
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
      vy = playerInputs[index].jump ? JUMP_SPEED : 0;
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

  let stepsFromStart = 0;
  function runPhysics() {
    const steps = Math.floor(
      (performance.now() / 1000 - lastPhysics) / PHYSICS.timeStep
    );
    lastPhysics += steps * PHYSICS.timeStep;
    for (let i = 0; i < steps; i++) {
      applyPlayerSpeed(0);
      applyPlayerSpeed(1);
      stepsFromStart++;
      world.Step(
        PHYSICS.timeStep,
        PHYSICS.velocityIterations,
        PHYSICS.positionIterations
      );
      // useless assignments to force redraw
      ball = ball;
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

  const computePlayerAngle = (players: b2Body[], playerIndex: number) => {
    const player = players[playerIndex].GetPosition();
    const ballPosition = ball.GetPosition();
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
      eyeAngle={computePlayerAngle(players, 0)}
      x={players[0].GetPosition().x}
      y={players[0].GetPosition().y}
    />
    <Player
      color="blue"
      radius={PLAYER_RADIUS}
      eyeAngle={computePlayerAngle(players, 1)}
      x={players[1].GetPosition().x}
      y={players[1].GetPosition().y}
    />
    <circle
      fill="yellow"
      cx={ball.GetPosition().x}
      cy={ball.GetPosition().y}
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
