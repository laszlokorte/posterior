<script>
    import { derived } from 'svelte/store';
    import {Viewport} from './viewport.svelte.js'

    let svg = $state()

    const {
        children,
        viewBox = "-500 -500 1000 1000", 
        preserveAspectRatio = "xMidYMid meet", 
        viewport = $bindable(new Viewport()),
        ...rest
    } = $props();

    $effect(() => {
        viewport.viewBoxString = viewBox
        viewport.aspectString = preserveAspectRatio
    });
</script>
<style>
    svg {
        display: block;
        width: 100svw;
        height: 100svh;
        background: #cfe7ebf0;
        max-width: 100%;
        max-height: 100%;
    }

    .debug-layer {
        pointer-events: none;
        user-select: none;
    }

    .debug-frame {
        stroke: purple;
        fill: purple;
        fill-opacity: 0.1;
    }
</style>
<svg 
bind:this={svg}
width={viewport.targetWidth} 
height={viewport.targetHeight} 
preserveAspectRatio={viewport.aspectString} 
bind:clientWidth={viewport.targetWidth} 
bind:clientHeight={viewport.targetHeight} 
{...rest}
viewBox={viewport.viewBoxString}>

    {#if svg}
    <g class="debug-layer">
        <rect class="debug-frame" x={viewport.minX} y={viewport.minY} width={viewport.width} height={viewport.height}></rect>
        <text dominant-baseline="middle" class="debug-text" x="0" y="0" text-anchor="middle">{viewport.targetWidth}&times;{viewport.targetHeight}</text>
    </g>
    {/if}
    {@render children(viewport, !!svg)}
</svg>

