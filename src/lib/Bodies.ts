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
import {
  WIDTH,
  PLAYER_RADIUS,
  PLAYER_CHAIN_SIZE,
  BALL_RADIUS,
  BALL_DAMPING,
  BALL_RESTITUTION,
  NET_RESTITUTION,
  NET_HEIGHT,
  GROUND_THICKNESS,
  NET_THICKNESS,
  PLAYER_STARTING_POS,
  BALL_STARTING_POS,
  GRAVITY,
} from "./Constants";

export function createWorld(): b2World {
  const gravity = new b2Vec2(0, -GRAVITY);
  const world = new b2World(gravity);

  // create ground
  const groundDef = new b2BodyDef();
  groundDef.position.Set(0, -GROUND_THICKNESS / 2);
  groundDef.userData = { kind: "GROUND" };
  const ground = world.CreateBody(groundDef);
  const groundBox = new b2PolygonShape();
  groundBox.SetAsBox(WIDTH * 5, GROUND_THICKNESS / 2);
  ground.CreateFixture(groundBox, 0);

  // create world
  const netDef = new b2BodyDef();
  netDef.position.Set(0, NET_HEIGHT / 2);
  const netBody = world.CreateBody(netDef);
  const netShape = new b2PolygonShape();
  netShape.SetAsBox(NET_THICKNESS / 2, NET_HEIGHT / 2);
  const netFixtureDef = new b2FixtureDef();
  netFixtureDef.shape = netShape;
  netFixtureDef.restitution = NET_RESTITUTION;
  netFixtureDef.friction = NET_RESTITUTION;
  netBody.CreateFixture(netFixtureDef);

  return world;
}

export function createBall(world: b2World): b2Body {
  const ballDef = new b2BodyDef();
  ballDef.type = b2BodyType.b2_dynamicBody;
  ballDef.position.Set(BALL_STARTING_POS.x, BALL_STARTING_POS.y);
  ballDef.userData = { kind: "BALL" };
  ballDef.linearDamping = BALL_DAMPING;
  let ballBody = world.CreateBody(ballDef);
  const ballShape = new b2CircleShape();
  ballShape.Set({ x: 0, y: 0 }, BALL_RADIUS);
  const ballFixtureDef = new b2FixtureDef();
  ballFixtureDef.shape = ballShape;
  ballFixtureDef.density = 1;
  ballFixtureDef.restitution = BALL_RESTITUTION;
  ballFixtureDef.friction = BALL_RESTITUTION;
  ballBody.CreateFixture(ballFixtureDef);
  return ballBody;
}

export function createPlayer(world: b2World, playerIndex: number): b2Body {
  const playerDef = new b2BodyDef();
  playerDef.type = b2BodyType.b2_kinematicBody;
  const startX = playerIndex == 0 ? -PLAYER_STARTING_POS : PLAYER_STARTING_POS;
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

export class ContactListener extends b2ContactListener {
  constructor(private callbacks :{
    onPlayerBall: (playerIndex: number) => void,
    onBallGround: () => void
  }
  ) {
    super();
  }
  override BeginContact(contact: b2Contact): void {
    const bodies = [contact.m_fixtureA.m_body, contact.m_fixtureB.m_body];
    const player = bodies.find((b) => b.m_userData?.kind == "PLAYER");
    const ball = bodies.find((b) => b.m_userData?.kind == "BALL");
    const ground = bodies.find((b) => b.m_userData?.kind == "GROUND");

    if (player && ball) {
      this.callbacks.onPlayerBall(player.m_userData!.playerIndex!);
    }
    if (ball && ground) {
      this.callbacks.onBallGround();
    }
  }
}
