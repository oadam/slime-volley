<script lang="ts">
  import logo from './assets/svelte.png'
  import Counter from './lib/Counter.svelte'
</script>

<main>
  <img src={logo} alt="Svelte Logo" />
  <h1>Hello Typescript!</h1>

  <Counter />


	  <svg id="player" width="200" height="100">
		  <circle cx="100" cy="100" r="100" fill="red"></circle>
		  <g transform="translate(100 100) rotate(-40)">
			  <circle cx="80" cy="0" r="10" fill="white"></circle>
			  <circle cx="80" cy="0" r="5" fill="black"></circle>
		  </g>
	  </svg>
	  <svg id="net" width="10" height="50" fill="black">
		  <rect width="100%" height="100%"></rect>
	  </svg>
	  <svg id="ball" width="30" height="30" fill="yellow">
		  <circle cx="15" cy="15" r="15"></circle>
	  </svg>
  


  <p>
    Visit <a href="https://svelte.dev">svelte.dev</a> to learn how to build Svelte
    apps.
  </p>

  <p>
    Check out <a href="https://github.com/sveltejs/kit#readme">SvelteKit</a> for
    the officially supported framework, also powered by Vite!
  </p>
</main>

<style>
  :root {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }

  main {
    text-align: center;
    padding: 1em;
    margin: 0 auto;
  }

  img {
    height: 16rem;
    width: 16rem;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4rem;
    font-weight: 100;
    line-height: 1.1;
    margin: 2rem auto;
    max-width: 14rem;
  }

  p {
    max-width: 14rem;
    margin: 1rem auto;
    line-height: 1.35;
  }

  @media (min-width: 480px) {
    h1 {
      max-width: none;
    }

    p {
      max-width: none;
    }
  }
</style>
