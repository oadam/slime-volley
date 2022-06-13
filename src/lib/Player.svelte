<script lang="ts">
  export let color = "red";
  export let radius = 1;
  export let eyeAngle = 40;
  export let x = 0;
  export let y = 0;
</script>

<g transform="translate({x} {y})">
  <defs>
    <clipPath id="hide-player-bottom">
      <rect x={-radius} y="0" width={2 * radius} height={radius} />
    </clipPath>
  </defs>
  <g clip-path="url(#hide-player-bottom)">
    <circle cx="0" cy="0" r={radius} fill={color} />
    <g transform="rotate({eyeAngle})">
      <circle cx={0.8 * radius} cy="0" r={0.1 * radius} fill="white" />
      <circle cx={0.8 * radius} cy="0" r={0.05 * radius} fill="black" />
    </g>
  </g>
</g>
