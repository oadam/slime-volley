<script lang="ts">
	import Player from './Player.svelte';
  let player1 = {
	eyeAngle: 20,
x:100,
y:0
	};
let player2: typeof player1 = {
	eyeAngle: 160,
x:400,
y:0
}
</script>

<Player {...player1} />
<Player {...player2} />


<svg width="10" height="50" fill="black">
	<rect width="100%" height="100%"></rect>
</svg>
<svg width="30" height="30" fill="yellow">
	<circle cx="15" cy="15" r="15"></circle>
</svg>

