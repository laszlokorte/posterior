<script>
    import { derived } from 'svelte/store';
    import {Viewport} from './viewport.js'
    import {SvelteViewportSVGAdapter} from './viewport.svelte.js'

    let svg = $state()

    const {
        children,
        viewBox = "-500 -500 1000 1000", 
        preserveAspectRatio = "xMidYMid meet", 
        svgAdapter = new SvelteViewportSVGAdapter(new Viewport().utility.svgAdapter),
        ...rest
    } = $props();


    $effect(() => {
        svgAdapter.viewBox = viewBox
        svgAdapter.preserveAspectRatio = preserveAspectRatio
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
width={svgAdapter.width} 
height={svgAdapter.height} 
viewBox={svgAdapter.viewBox}
preserveAspectRatio={svgAdapter.preserveAspectRatio} 
bind:clientWidth={svgAdapter.width} 
bind:clientHeight={svgAdapter.height} 
{...rest}>

    {@render children(svgAdapter, !!svg)}

    
    {#if svg}
    <g class="debug-layer">
        <rect class="debug-frame" x={svgAdapter.viewBoxMinX} y={svgAdapter.viewBoxMinY} width={svgAdapter.viewBoxWidth} height={svgAdapter.viewBoxHeight}></rect>
        <text dominant-baseline="middle" class="debug-text" x="0" y="0" text-anchor="middle">{svgAdapter.width}&times;{svgAdapter.height}</text>
    </g>
    {/if}
</svg>

