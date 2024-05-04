
<title>Posterior</title>

<script>
  import Canvas from '../lib/Canvas.svelte'
  import {Viewport, ReactiveViewport} from '../lib/viewport.js'
  import {join, map} from '../lib/utils.js'

    const decimalFormat = new Intl.NumberFormat("en-US", {notation: "scientific",});

    let reactiveVP = new ReactiveViewport()
  
    let debug = $state(false)
    let pressedMean = $state(false)
    let pressedStdDev = $state(false)
    let pressedStdDevMirror = $state(0)
    let distType = $state('gauss')
    let mean = $state(20)
    let stdDev = $state(40)
    let pressOffset = $state(0)
    let logScale = $state(false)

    let samples = $state([])
    let sampleColors = $state([
        '#2f4f4f','#006400','#b8860b','#4b0082',
        '#ff0000','#c71585','#7fff00','#00fa9a',
        '#00ffff','#0000ff','#ff00ff','#1e90ff',
        '#fa8071'])

    let likelihood = $derived(samples.reduce((acc, {x}) => acc*currentPdf(x, mean, stdDev), 1))
    let logLikelihood = $derived(Math.log(likelihood))

    function addSample({x}) {
        if(sampleColors.length) {
            samples.push({x, color: sampleColors.pop()})
        }
    }

    function clearSamples() {
        sampleColors.push(...samples.map(({color}) => color))
        samples.length = 0
    }

    function pressMean(local, evt, vp) {
        pressedMean = true
        pressOffset = local.x - mean

        evt.currentTarget.setPointerCapture(evt.pointerId);
    }

    function pressStdDev(local, evt, vp, mirror) {
        pressedStdDev = true
        pressedStdDevMirror = mirror
        pressOffset = local.x - mirror*stdDev

        evt.currentTarget.setPointerCapture(evt.pointerId);
    }

    function move(local, evt, vp) {
        if(pressedMean) {
            mean = vp.clampVisibleX(local.x - pressOffset)
        } else if(pressedStdDev) {
            stdDev = Math.max(0, pressedStdDevMirror*vp.clampVisibleX(local.x - pressOffset))
        }
    }

    function release(local, evt, vp) {
        pressedMean = false
        pressedStdDev = false
        pressedStdDevMirror = 0
    }

    const distributions = {
        gauss: {
            pdf(x, m, std) {
                return Math.exp(-0.5*Math.pow((x-m)/std,2))/std/Math.sqrt(2*Math.PI)
            },
            logPdf(x, m, std) {
                return -0.5*Math.pow((x-m)/std,2)/8000 - Math.log(std*Math.sqrt(2*Math.PI))/8000
            },
            get parameters () {
                return ['mean','stdDev']
            },
            get name () {
                return "Gaußian"
            },
            get color() {
                return 'darkred'
            }
        },
        laplace: {
            pdf(x, m, std) {
                return Math.exp(-Math.abs((x-m)/std))/std/2
            },
                logPdf(x, m, std) {
                return -Math.abs((x-m)/std)/8000 - Math.log(std*2)/8000
            },
            get parameters () {
                return ['mean','stdDev']
            },
            get name () {
                return "Laplace"
            },
            get color() {
                return 'darkgreen'
            }
        },
        uniform: {
            pdf(x, m, std) {
                return Math.abs(x-m) < std ? 0.5/std : 0
            },
            logPdf(x, m, std) {
                return Math.abs(x-m) < std ? Math.log(0.5/std)/8000 : -10000
            },
            get parameters () {
                return ['mean','stdDev']
            },
            get name () {
                return "Gaußian"
            },
            get color() {
                return 'darkblue'
            }
        }
    }
    let currentDistribution = $derived(distributions[distType])
    let currentPdf = $derived(logScale ? distributions[distType].logPdf : distributions[distType].pdf)
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

    .ontop {
        label, button, input, select, textarea {
            pointer-events: all;
        }
    }

    .state-active {
        stroke: #4a89bc;
        stroke-width: 2px;
    }

    .handle {
        stroke: #fff;
        stroke-width: 2px;
    }
    
    .controls {
        background-color: #0003;
        padding: 1em;
        width: max-content;
    }
</style>

<div class="grid">
    <div class="hud">
        <div class="ontop">
            <div class="controls">
                <div>
                    Distribution:<br>
                    {#each Object.entries(distributions) as [c, d]}
                        <label><input type="radio" value={c} bind:group={distType} /> {d.name}</label>
                    {/each}
                </div>
                <div>
                    Scale:<br>
                    <label><input type="radio" value={false} bind:group={logScale} /> Linear</label>
                    <label><input type="radio" value={true} bind:group={logScale} /> Log</label>
                </div>
    
                <div>
                    Likelihood: {logScale ? decimalFormat.format(logLikelihood) : decimalFormat.format(likelihood)}
                </div>
    
                <div>
                    <label><input type="checkbox" bind:checked={debug}> Debug</label>
                    <button onclick={clearSamples}>Clear</button>
                    
                    <p>
                        {$reactiveVP.screen.size.x}&times;{$reactiveVP.screen.size.y}
                    </p>
                </div>
            </div>
        </div>
        <Canvas viewBox="-400 -400 800 800" preserveAspectRatio="xMidYMid meet" viewport={reactiveVP}>
            {#snippet children(viewport, ready)}
                {#if ready}
                    {@const adapter = viewport.svgAdapter}
                    {@const yScale = -adapter.visibleHeight*30}
                    {@const axisPadding = 10}
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
                        <text x={adapter.visibleMax.x-20} y="-10" text-anchor="end">Measurement</text>
                        <text transform-origin="-5 {adapter.visibleMin.y+20}" transform="rotate(-90)" y={adapter.visibleMin.y+20} x="-5" text-anchor="end">Probability</text>
                    </g>
                    <g>
                        <path class="axis-arrowhead" d="M{adapter.visibleMax.x},0l-10,-5v10z" fill="black" />
                        <path class="axis-arrowhead" d="M0,{adapter.visibleMin.y}l-5,10h10z" fill="black" />
                    </g>
                    <g>
                        <polyline class="plot-area" fill-opacity="0.1" fill={currentDistribution.color} stroke="none" stroke-width="2" points={`${adapter.visibleMin.x+axisPadding},0,`+join(",", map(adapter.linspaceX(axisPadding), x => `${x},${yScale*currentPdf(x,mean,std)}`))+`,${adapter.visibleMax.x-axisPadding},0`} />
                        <polyline class="plot-line" fill="none" stroke={currentDistribution.color} stroke-width="2" points={join(",", map(adapter.linspaceX(axisPadding), x => `${x},${yScale*currentPdf(x,mean,std)}`))} />
                    </g>
                    <g>
                        <rect cursor="copy" fill-opacity="0.2" fill="#ffaa00" x={adapter.visibleMin.x+axisPadding} y={0}  width={adapter.visibleWidth-2*axisPadding} height={40} onpointerdown={adapter.delegate(addSample)} />
                        <text x={adapter.visibleMin.x + 20} y={20} dominant-baseline="middle">Samples</text>
                    </g>
                    <g pointer-events="none">
                        {#each samples as {x,color}}
                        <circle cx={x} cy={20} r="5" fill={color}></circle>
                        <circle cx={x} cy={yScale*currentPdf(x, mean, std)} r="2" fill={color}></circle>
                        <line x1={x} y1={0} x2={x} y2={yScale*currentPdf(x, mean, std)} stroke={color}></line>
                        {/each}
                    </g>
                    <line stroke-dasharray="3 3" stroke-dashoffset={-stdDev} stroke="black" x1={mean-stdDev} x2={mean+stdDev} y1={60} y2={60} />
                    
                    <g>
                        <circle class="handle" onpointermove={adapter.delegate(move)} onpointerup={adapter.delegate(release)} onpointerdown={adapter.delegate(pressMean)} class:state-active={pressedMean} fill={currentDistribution.color} cursor="move" cx={mean} cy={80} r="10"></circle>
                        <text class="label-text" x={mean} y={80} dominant-baseline="middle" text-anchor="middle" fill="#ffffff">&mu;</text>    
                        <text font-size="0.8em" class="label-text" x={mean} y={105} text-anchor="middle" stroke="white" stroke-width="5" paint-order="stroke">Mean</text>  
                    </g>
                    <g>
                        <circle class="handle" onpointermove={adapter.delegate(move)} onpointerup={adapter.delegate(release)} onpointerdown={adapter.delegate(pressStdDev, 1)} class:state-active={pressedStdDev} fill={currentDistribution.color} cursor="move" cx={mean + stdDev} cy={60} r="10"></circle>
                        <text class="label-text" x={mean+stdDev} y={60} dominant-baseline="middle" text-anchor="middle" fill="#ffffff">&sigma;</text>    
                        <text font-size="0.8em" class="label-text" x={mean+stdDev} y={90} text-anchor="middle" stroke="white" stroke-width="5" paint-order="stroke">StdDev</text>    
                    </g>
                    <g>
                        <circle class="handle" onpointermove={adapter.delegate(move)} onpointerup={adapter.delegate(release)} onpointerdown={adapter.delegate(pressStdDev, -1)} class:state-active={pressedStdDev} fill={currentDistribution.color} cursor="move" cx={mean - stdDev} cy={60} r="10"></circle>
                        <text class="label-text" x={mean+stdDev} y={60} dominant-baseline="middle" text-anchor="middle" fill="#ffffff">&sigma;</text>    
                    </g>
                {/if}
            {/snippet}
        </Canvas>
    </div>
    
    <Canvas preserveAspectRatio="xMidYMid meet" viewBox="-1000 -300 2000 600">
        {#snippet children(viewport, ready)}
        {@const adapter = viewport.svgAdapter}
        <circle onpointermove={adapter.delegate(move)} onpointerup={adapter.delegate(release)} onpointerdown={adapter.delegate(pressMean)}  fill="purple" cursor="move" cx={mean} cy={stdDev} r="20"></circle>
        {/snippet}
    </Canvas>

    <Canvas preserveAspectRatio="xMidYMin slice" viewBox="-100 -300 200 600">
        {#snippet children(viewport, ready)}
        {@const adapter = viewport.svgAdapter}
        <circle onpointermove={adapter.delegate(move)} onpointerup={adapter.delegate(release)} onpointerdown={adapter.delegate(pressMean)}  fill="purple" cursor="move" cx={mean} cy={stdDev} r="20"></circle>
        {/snippet}
    </Canvas>
</div>

