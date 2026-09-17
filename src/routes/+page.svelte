<script lang="ts">
  import StarfieldBackground from '$lib/components/StarfieldBackground.svelte';
  import CartoonGlobe from '$lib/components/CartoonGlobe.svelte';
</script>

<svelte:head>
  <title>GEO SERG</title>
  <meta name="description" content="GEO SERG — Interactive Cartoon Globe" />
</svelte:head>

<!-- Cosmic Moving Stars Background -->
<StarfieldBackground />

<!-- Homepage Main Layout -->
<main class="homepage-stage">
  <div class="content-wrapper">
    <!-- Left: Stacked GEO on top of SERG, Monospace, Left-Aligned -->
    <div class="left-hero">
      <h1 class="brand-title">
        <span class="word-geo">GEO</span>
        <span class="word-serg">SERG</span>
      </h1>
    </div>

    <!-- Right: Cartoon Spinning Globe -->
    <div class="right-globe">
      <CartoonGlobe size={580} />
    </div>
  </div>
</main>

<style>
  .homepage-stage {
    position: relative;
    z-index: 10;
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    user-select: none;
  }

  .content-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 40px;
    max-width: 1400px;
    width: 90%;
    padding: 20px;
  }

  .left-hero {
    flex: 1.1;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding-left: clamp(10px, 3vw, 60px);
  }

  /* Massive Monospace Left-Aligned Title - Blocky & Sharp */
  .brand-title {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
    margin: 0;
    font-family: 'Rubik Mono One', var(--font-mono), 'Lucida Console', 'Courier New', monospace;
    font-size: clamp(5.5rem, 11vw, 10.5rem);
    font-weight: 900;
    line-height: 0.95;
    letter-spacing: -0.02em;
  }

  /* Solid Green GEO - No glow */
  .word-geo {
    color: #43d87d;
    display: block;
    text-shadow: none;
  }

  /* Solid Blue SERG - No glow */
  .word-serg {
    color: #38b6ff;
    display: block;
    text-shadow: none;
  }

  .right-globe {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @media (max-width: 960px) {
    .content-wrapper {
      flex-direction: column;
      justify-content: center;
      gap: 30px;
    }
    .left-hero {
      justify-content: center;
      padding-left: 0;
    }
    .brand-title {
      font-size: clamp(4.5rem, 16vw, 7.5rem);
      align-items: center;
      text-align: center;
    }
  }
</style>
