export const SCREEN_WIDTH = 0.9 * window.innerWidth;
export const SCREEN_HEIGHT = 0.9 * window.innerHeight;
export const SCORE_PADDING = 50;
export const GROUND_WIDTH = 10;
export const WIDTH = 20;
export const PLAYER_RADIUS = 1.8;
export const AI_SIMUL_COUNT = 10;
export const PLAYER_SPEED = 30 / 3.6;
export const PLAYER_CHAIN_SIZE = 20;
export const JUMP_HEIGHT = 1.0;
export const BALL_RADIUS = 0.3;
export const BALL_DAMPING = 0.4;
export const BALL_RESTITUTION = 0.8;
export const NET_RESTITUTION = 0.3;
export const NET_HEIGHT = 1.5;
export const GROUND_THICKNESS = 0.1;
export const NET_THICKNESS = 0.15;
export const PLAYER_STARTING_POS = (0.8 * GROUND_WIDTH) / 2;
export const BALL_STARTING_POS = {
  x: PLAYER_STARTING_POS,
  y: 5,
  vy: 15,
};
export const GRAVITY = 10;
export const PHYSICS = {
  timeStep: 1 / 60,
  velocityIterations: 6,
  positionIterations: 2,
};
export const CONTROLS = [
  { left: "q", jump: "z", right: "d" },
  { left: "ArrowLeft", jump: "ArrowUp", right: "ArrowRight" },
];
