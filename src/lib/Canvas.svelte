<script>
    import { derived } from "svelte/store";
    import { Viewport, ReactiveViewport } from "./viewport.svelte.js";

    let svg = $state();

    const {
        children,
        viewBox = "-500 -500 1000 1000",
        preserveAspectRatio = "xMidYMid meet",
        viewport = $bindable(new ReactiveViewport(new Viewport())),
        ...rest
    } = $props();

    $effect(() => {
        viewport.svgAdapter.viewBox = viewBox;
        viewport.svgAdapter.preserveAspectRatio = preserveAspectRatio;
    });
</script>

<svg
    bind:this={svg}
    width={$viewport.svgAdapter.width}
    height={$viewport.svgAdapter.height}
    viewBox={$viewport.svgAdapter.viewBox}
    preserveAspectRatio={$viewport.svgAdapter.preserveAspectRatio}
    bind:clientWidth={viewport.svgAdapter.width}
    bind:clientHeight={viewport.svgAdapter.height}
    {...rest}
>
    {#if svg}
        <g class="debug-layer">
            <rect
                class="debug-frame"
                x={$viewport.svgAdapter.viewBoxMinX}
                y={$viewport.svgAdapter.viewBoxMinY}
                width={$viewport.svgAdapter.viewBoxWidth}
                height={$viewport.svgAdapter.viewBoxHeight}
            ></rect>
            <text
                dominant-baseline="middle"
                class="debug-text"
                x="0"
                y="0"
                text-anchor="middle"
                >{$viewport.svgAdapter.width}&times;{$viewport.svgAdapter
                    .height}</text
            >
        </g>

        {@render children($viewport, !!svg)}
    {/if}
</svg>

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
