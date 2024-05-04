<script>
    import { derived } from 'svelte/store';
    import {Viewport, ReactiveViewport} from './viewport.js'

    let svg = $state()
    
    const {
        children,
        viewBox = "-500 -500 1000 1000", 
        preserveAspectRatio = "xMidYMid meet", 
        viewport = new ReactiveViewport(new Viewport()),
        ...rest
    } = $props();

    let svgAdapter = $derived($viewport.svgAdapter)

    $effect(() => {
        viewport.svgAdapter.viewBox = viewBox
        viewport.svgAdapter.preserveAspectRatio = preserveAspectRatio
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

    {#if svg}
    <g class="debug-layer">
        <rect class="debug-frame" x={svgAdapter.viewBoxMinX} y={svgAdapter.viewBoxMinY} width={svgAdapter.viewBoxWidth} height={svgAdapter.viewBoxHeight}></rect>
        <text dominant-baseline="middle" class="debug-text" x="0" y="0" text-anchor="middle">{svgAdapter.width}&times;{svgAdapter.height}</text>
    </g>

    {@render children($viewport, !!svg)}

    {/if}
    
</svg>

