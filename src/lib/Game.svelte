<script lang="ts">
  import Player from "./Player.svelte";
  import { onMount } from "svelte";
  import {
    b2Vec2,
    b2World,
    b2PolygonShape,
    b2CircleShape,
    b2ChainShape,
    b2FixtureDef,
    b2BodyDef,
    b2ContactListener,
    b2BodyType,
    XY,
  } from "@flyover/box2d";

  const SCREEN_WIDTH = 800;
  const SCREEN_HEIGHT = 600;
  const WIDTH = 10;
  const PLAYER_RADIUS = 1;
  const PLAYER_CHAIN_SIZE = 100;
  const JUMP_HEIGHT = 3;
  const BALL_RADIUS = 0.2;
  const BALL_RESTITUTION = 0.8;
  const NET_HEIGHT = 2.4;
  const GROUND_THICKNESS = 0.1;
  const NET_THICKNESS = 0.05;
  const PLAYER_STARTING_POS = 10 * 0.7;
  const BALL_STARTING_POS = {
    x: 0.1 * WIDTH,
    y: 3 * NET_HEIGHT,
  };
  const GRAVITY = 10;
  const PHYSICS = {
    timeStep: 1 / 60,
    velocityIterations: 6,
    positionIterations: 2,
  };

  const gravity = new b2Vec2(0, -GRAVITY);
  const world = new b2World(gravity);
  const groundBodyDef = new b2BodyDef();
  groundBodyDef.position.Set(0, -GROUND_THICKNESS / 2);
  const groundBody = world.CreateBody(groundBodyDef);
  // Define the ground box shape.
  const groundBox = new b2PolygonShape();
  // The extents are the half-widths of the box.
  groundBox.SetAsBox(WIDTH, GROUND_THICKNESS / 2);
  // Add the ground fixture to the ground body.
  groundBody.CreateFixture(groundBox, 0);

  const ballDef = new b2BodyDef();
  ballDef.type = b2BodyType.b2_dynamicBody;
  ballDef.position.Set(BALL_STARTING_POS.x, BALL_STARTING_POS.y);
  const ballBody = world.CreateBody(ballDef);
  const ballShape = new b2CircleShape();
  ballShape.Set({ x: 0, y: 0 }, BALL_RADIUS);
  const ballFixtureDef = new b2FixtureDef();
  ballFixtureDef.shape = ballShape;
  ballFixtureDef.density = 1;
  ballFixtureDef.restitution = BALL_RESTITUTION;
  ballFixtureDef.friction = BALL_RESTITUTION;
  ballBody.CreateFixture(ballFixtureDef);
  let ballPosition = ballBody.GetPosition();

  function makePlayer(startX: number) {
    const playerDef = new b2BodyDef();
    playerDef.type = b2BodyType.b2_kinematicBody;
    playerDef.position.Set(startX, 0);
    const playerBody = world.CreateBody(playerDef);
    const playerShape = new b2ChainShape();
    const playerPoints = [];
    for (let p = 0; p < PLAYER_CHAIN_SIZE; p++) {
      const angle = Math.PI * (1 - (p / (PLAYER_CHAIN_SIZE - 1)));
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

  let player1Body = makePlayer(BALL_STARTING_POS.x*1.02)
  let player1Position = player1Body.GetPosition();
  let player2Body = makePlayer(-WIDTH / 2)
  let player2Position = player2Body.GetPosition();

  class MyListener extends b2ContactListener {
    override BeginContact(contact): void {
    }
  }
  world.SetContactListener(new MyListener());
  /*function maybeBounceBall(
    wallAngle: number,
    wallDistance: number,
    wallSpeed: number,
    restitution: number
  ): boolean {
    const dDistance =
      PHYSICS_LOOP_MS *
      (Math.sin(wallAngle) * ball.vx - Math.cos(wallAngle) * ball.vy);
    if (wallDistance + dDistance > 0) {
      return false;
    }
    const timeBeforeBounce = (-wallDistance / dDistance) * PHYSICS_LOOP_MS;
    console.assert(timeBeforeBounce > 0);
    console.assert(timeBeforeBounce < PHYSICS_LOOP_MS);
    ball.x += timeBeforeBounce * ball.vx;
    ball.y += timeBeforeBounce * ball.vy;
    const oldVAngle = Math.atan(ball.vy / ball.vx);
    const newVAngle = Math.PI - oldVAngle + 2 * wallAngle;
    const timeAfterBounce = PHYSICS_LOOP_MS - timeBeforeBounce;
    const oldV = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    const newV = restitution * oldV;
    ball.vx = newV * Math.cos(newVAngle);
    ball.vy = -newV * Math.sin(newVAngle);
    ball.x += timeAfterBounce * ball.vx;
    ball.y += timeAfterBounce * ball.vy;
    return true;
  }*/

  let lastPhysics = performance.now() / 1000;
  function runPhysics() {
    const steps = Math.floor(
      (performance.now() / 1000 - lastPhysics) / PHYSICS.timeStep
    );
    lastPhysics += steps * PHYSICS.timeStep;
    for (let i = 0; i < steps; i++) {
      world.Step(
        PHYSICS.timeStep,
        PHYSICS.velocityIterations,
        PHYSICS.positionIterations
      );
      // useless assignments to force redraw
      ballPosition = ballBody.GetPosition();
      player1Position = player1Body.GetPosition();
      player2Position = player2Body.GetPosition();
    }
  }

  onMount(async () => {
    let i = 0;
    let rid = requestAnimationFrame(function update() {
      i++;
      runPhysics();
      rid = requestAnimationFrame(update);
    });
    return () => cancelAnimationFrame(rid);
  });

  const computePlayerAngle = (player: XY) => {
    const atan =
      (180 / Math.PI) *
      Math.atan(-(player.y - ballPosition.y) / (player.x - ballPosition.x));
    const inBack = ballPosition.x < player.x ? 180 : 0;
    return 360 + inBack - atan;
  };
</script>

<svg
  class="game"
  style:width="{SCREEN_WIDTH}px"
  style:height="{SCREEN_HEIGHT}px"
>
  <g
    transform="
      translate({SCREEN_WIDTH / 2} {SCREEN_HEIGHT})
      scale({SCREEN_WIDTH / WIDTH} {-SCREEN_WIDTH / WIDTH})
    "
  >
    <Player
      color="red"
      radius={PLAYER_RADIUS}
      eyeAngle={computePlayerAngle(player1Position)}
      x={player1Position.x}
      y={player1Position.y}
    />
    <Player
      color="blue"
      radius={PLAYER_RADIUS}
      eyeAngle={computePlayerAngle(player2Position)}
      x={player2Position.x}
      y={player2Position.y}
    />
    <circle
      fill="yellow"
      cx={ballPosition.x}
      cy={ballPosition.y}
      r={BALL_RADIUS}
    />
  </g>
</svg>

<style>
  .game {
    position: relative;
    background: lightblue;
  }
</style>
