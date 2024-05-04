
<title>Posterior</title>

<script>
  import Canvas from '../lib/Canvas.svelte'
  import { Viewport } from '../lib/viewport.js';
  import {SvelteViewportSVGAdapter} from '../lib/viewport.svelte.js'

    let vp = new Viewport()
    let svgAdapter = new SvelteViewportSVGAdapter(vp.utility.svgAdapter)

    let debug = $state(false)
    let pressedMean = $state(false)
    let pressedStdDev = $state(false)
    let distType = $state('gauss')
    let mean = $state(20)
    let stdDev = $state(20)
    let pressOffset = $state(0)

    let samples = $state([])


    function addSample({x}) {
        samples.push(x)
    }

    function clearSamples() {
        samples.length = 0
    }

    function pressMean(local, evt, vp) {
        pressedMean = true
        pressOffset = local.x - mean

        evt.currentTarget.setPointerCapture(evt.pointerId);
    }

    function pressStdDev(local, evt, vp) {
        pressedStdDev = true
        pressOffset = local.x - stdDev

        evt.currentTarget.setPointerCapture(evt.pointerId);
    }

    function move(local, evt, vp) {
        if(pressedMean) {
            mean = vp.clampVisibleX(local.x - pressOffset)
        } else if(pressedStdDev) {
            stdDev = Math.max(0, vp.clampVisibleX(local.x - pressOffset))
        }
    }

    function release(local, evt, vp) {
        pressedMean = false
        pressedStdDev = false
    }

    const colors = {
        gauss: 'red',
        laplace: 'green',
        uniform: 'blue',
    }

    const pdfs = {
        gauss(x, m, std) {
            return Math.exp(-0.5*Math.pow((x-m)/std,2))/std/Math.sqrt(2*Math.PI)
        },
        laplace(x, m, std) {
            return Math.exp(-Math.abs((x-m)/std))/std/2
        },
        uniform(x, m, std) {
            return Math.abs(x-m) < std ? 0.5/std : 0
        }
    }

    function lerp(a,b,t) {
        return (1-t)*a + t*b
    }

    function* linspace(a,b,c) {
        for(let i=0;i<=c;i++) {
            yield lerp(a,b,i/c)
        }
    }

    function* map(gen, fn) {
        for(const v of gen) {
            yield fn(v)
        }
    }

    function join(sep, gen) {
        let result = ''
        for(const v of gen) {
            if(result !== '') {
                result += sep
            }
            result += v
        }

        return result
    }
</script>

<style>
    .grid {
        display: grid;
        grid-template-rows: auto;
        place-content: stretch;
        place-items: stretch;
    }

    .hidden {
        display: none
    }

    polyline {
        shape-rendering: geometricPrecision;
    }

    path, line {
        shape-rendering: geometricPrecision;
    }

    .axis-line {
        stroke-width: 1px;
    }

    .plot-line {
        stroke-width: 1px;
    }
    
    .axis-arrowhead {
        shape-rendering: optimizeSpeed;
    }

    .plot-area {
        shape-rendering: optimizeSpeed;
    }

    .label-text {
        pointer-events: none;
        user-select: none;
    }

    .hud {
        display: grid;
        grid-template-rows: 1fr;
        place-content: stretch;
        place-items: stretch;
    }

    .hud > :global(*) {
        grid-column: 1 / 1;
        grid-row: 1 / 1;
    }

    .ontop {
        z-index: 1;
        pointer-events: none;
    }

    .ontop label {
        pointer-events: all;
    }
</style>

<div class="grid">
    <div class="hud">
        <div class="ontop">
            {#each Object.keys(colors) as c}
                 <label><input type="radio" value={c} bind:group={distType} /> {c}</label>
            {/each}
        </div>
        <Canvas preserveAspectRatio="xMidYMid meet" svgAdapter={svgAdapter}>
            {#snippet children(adapter, ready)}
                {#if ready}
                    {@const yScale = -adapter.visibleHeight*30}
                    {@const axisPadding = 5}
                    {@const std = Math.max(1, stdDev)}
            
                    <g pointer-events="all">
                        <rect x={adapter.visibleMin.x} y={adapter.visibleMin.y} width={adapter.visibleWidth} height={adapter.visibleHeight}  fill="white"></rect>
                    </g>
                    <g class:hidden={!debug} pointer-events="none">
                        <line stroke-width="1px" stroke="black" stroke-opacity="0.1" 
                        x1={adapter.visibleMin.x} x2={adapter.visibleMax.x} 
                        y1={adapter.visibleMin.y} y2={adapter.visibleMax.y}></line>
                        <line stroke-width="1px" stroke="black" stroke-opacity="0.1" 
                        x1={adapter.visibleMax.x} x2={adapter.visibleMin.x} 
                        y1={adapter.visibleMin.y} y2={adapter.visibleMax.y}></line>
                        <line stroke-width="1px" stroke="black" stroke-opacity="0.1" 
                        x1={0} x2={0} 
                        y1={adapter.visibleMin.y} y2={adapter.visibleMax.y}></line>
                        <line stroke-width="1px" stroke="black" stroke-opacity="0.1" 
                        y1={0} y2={0} 
                        x1={adapter.visibleMin.x} x2={adapter.visibleMax.x}></line>
                    </g>
                    <g>
                        <line class="axis-line" stroke="black" 
                        x1={0} x2={0} 
                        y1={adapter.visibleMin.y+axisPadding} y2={adapter.visibleMax.y-axisPadding}></line>
                        <line class="axis-line" stroke="black" 
                        y1={0} y2={0} 
                        x1={adapter.visibleMin.x+axisPadding} x2={adapter.visibleMax.x-axisPadding}></line>
                    </g>
                    <g>
                        <path class="axis-arrowhead" d="M{adapter.visibleMax.x},0l-10,-5v10z" fill="black" />
                        <path class="axis-arrowhead" d="M0,{adapter.visibleMin.y}l-5,10h10z" fill="black" />
                    </g>
                    <g>
                        <polyline class="plot-area" fill-opacity="0.1" fill={colors[distType]} stroke="none" stroke-width="2" points={`${adapter.visibleMin.x+axisPadding},0,`+join(",", map(adapter.linspaceX(axisPadding), x => `${x},${yScale*pdfs[distType](x,mean,std)}`))+`,${adapter.visibleMax.x-axisPadding},0`} />
                        <polyline class="plot-line" fill="none" stroke={colors[distType]} stroke-width="2" points={join(",", map(adapter.linspaceX(axisPadding), x => `${x},${yScale*pdfs[distType](x,mean,std)}`))} />
                    </g>
                    <rect fill-opacity="0.2" fill="#ffff33" x={adapter.visibleMin.x} y={0}  width={adapter.visibleWidth} height={40} onpointerdown={adapter.delegate(addSample)} />
                    <g pointer-events="none">
                        {#each samples as x}
                        <circle cx={x} cy={5} r="5" fill="darkred"></circle>
                        <line x1={x+1} y1={0} x2={x+1} y2={yScale*pdfs[distType](x, mean, std)} stroke={colors[distType]}></line>
                        {/each}
                    </g>
                    <circle onpointermove={adapter.delegate(move)} onpointerup={adapter.delegate(release)} onpointerdown={adapter.delegate(pressMean)} fill={pressedMean?'rebeccapurple':'purple'} cursor="move" cx={mean} cy={adapter.visibleMin.y/2} r="20"></circle>
                    <circle onpointermove={adapter.delegate(move)} onpointerup={adapter.delegate(release)} onpointerdown={adapter.delegate(pressStdDev)} fill={pressedStdDev?'lightblue':'darkblue'} cursor="move" cx={mean+ stdDev} cy={adapter.visibleMin.y/2} r="15"></circle>
                    <text class="label-text" x={mean} y={adapter.visibleMin.y/2-30} text-anchor="middle">Mean</text>  
                    <text class="label-text" x={mean+stdDev} y={adapter.visibleMin.y/2+30} text-anchor="middle">StdDev</text>    
                {/if}
            {/snippet}
        </Canvas>
    </div>

    <div>
        <label><input type="checkbox" bind:checked={debug}> Debug</label>
        <button onclick={clearSamples}>Clear</button>
        
        <p>
            {svgAdapter.width}&times{svgAdapter.height}
        </p>
    </div>
    
    <Canvas preserveAspectRatio="xMidYMid slice">
        {#snippet children(adapter, ready)}
        <circle onpointermove={adapter.delegate(move)} onpointerup={adapter.delegate(release)} onpointerdown={adapter.delegate(pressMean)}  fill="purple" cursor="move" cx={mean} cy={stdDev} r="20"></circle>
        {/snippet}
    </Canvas>
</div>

