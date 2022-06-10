<script lang="ts">
	export let eyeAngle = 40;
	export let x = 0;
	export let y = 0;
</script>

<svg width="200" height="100" style:transform="translate({x}px, {y}px)">
	<circle cx="100" cy="100" r="100" fill="red"></circle>
	<g transform="translate(100 100) rotate(-{eyeAngle})">
		<circle cx="80" cy="0" r="10" fill="white"></circle>
		<circle cx="80" cy="0" r="5" fill="black"></circle>
	</g>
</svg>
