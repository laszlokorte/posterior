<script>
  import Canvas from '../lib/Canvas.svelte'
  import { Viewport } from '../lib/viewport.svelte';

    let vp = $state(new Viewport())
    let vp2 = $state(new Viewport())

    let pressed = $state(false)
    let click = $state({x:0,y:0})
    let click2 = $state({x:0,y:0})
    let offset = $state({x:0,y:0})

    function press(local, evt) {
        pressed = true
        offset.x = local.x - click.x
        offset.y = local.y - click.y

        evt.currentTarget.setPointerCapture(evt.pointerId);
    }
    function move(local, evt) {
        if(pressed) {
            click = vp.clampVisible({
                x: local.x - offset.x,
                y: local.y - offset.y
            })
            click2 = vp.clampViewbox({
                x: local.x - offset.x,
                y: local.y - offset.y
            })
        }
    }
    function release(local, evt) {
        pressed = false
    }
</script>

<style>
    .grid {
        display: grid;
        grid-template-rows: auto;
        place-content: stretch;
        place-items: stretch;
    }
</style>

<div class="grid">
    <Canvas preserveAspectRatio="xMinYMin meet" let:ready bind:viewport={vp}>
        {#snippet children(v, ready)}
        {#if ready}
        <g pointer-events="all">
            <rect x={v.visibleMin.x} y={v.visibleMin.y} width={v.visibleWidth} height={v.visibleHeight} fill-opacity="0.1" fill="red"></rect>
        </g>
        <g pointer-events="none">
            <line stroke-width="2" stroke="black" stroke-opacity="0.1" 
            x1={v.visibleMin.x} x2={v.visibleMax.x} 
            y1={v.visibleMin.y} y2={v.visibleMax.y}></line>
            <line stroke-width="2" stroke="black" stroke-opacity="0.1" 
            x1={v.visibleMax.x} x2={v.visibleMin.x} 
            y1={v.visibleMin.y} y2={v.visibleMax.y}></line>
            <line stroke-width="2" stroke="black" stroke-opacity="0.1" 
            x1={0} x2={0} 
            y1={v.visibleMin.y} y2={v.visibleMax.y}></line>
            <line stroke-width="2" stroke="black" stroke-opacity="0.1" 
            y1={0} y2={0} 
            x1={v.visibleMin.x} x2={v.visibleMax.x}></line>
        </g>
        <circle onpointermove={v.delegate(move)} onpointerup={v.delegate(release)} onpointerdown={v.delegate(press)} fill={pressed?'rebeccapurple':'purple'} cursor="move" cx={click.x} cy={click.y} r="70"></circle>
        <circle onpointermove={v.delegate(move)} onpointerup={v.delegate(release)} onpointerdown={v.delegate(press)} fill={pressed?'lightblue':'darkblue'} cursor="move" cx={click2.x} cy={click2.y} r="10"></circle>
        {/if}
        {/snippet}
    </Canvas>

    <p>
        {vp.targetWidth}&times;{vp.targetHeight}
    </p>

    
    <Canvas preserveAspectRatio="xMidYMid slice" bind:viewport={vp2}>
        {#snippet children(v, ready)}
        <circle  onpointermove={v.delegate(move)} onpointerup={v.delegate(release)} onpointerdown={v.delegate(press)} fill="purple" cursor="move" cx={click.x} cy={click.y} r="20"></circle>
        {/snippet}
    </Canvas>
</div>

