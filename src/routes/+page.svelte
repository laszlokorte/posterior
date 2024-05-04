
<title>Posterior</title>

<script>
  import Canvas from '../lib/Canvas.svelte'
  import {Viewport, ReactiveViewport} from '../lib/viewport.js'
  import {join, map} from '../lib/utils.js'

    const decimalFormat = new Intl.NumberFormat("en-US", {notation: "scientific",});

    let reactiveVP = new ReactiveViewport()
    
    const id = (x) => x
    const squareDist2 = (m) => (x) => Math.pow(x-m, 2)

    let debug = $state(false)
    let pressedParameter = $state(null)
    let distType = $state('gauss')
    let pressOffset = $state(0)
    let logScale = $state(false)

    let parameterValues = $state({
        mean: 0,
        scale: 30,
        variance: 900,
        min: -100,
        max: 100,
    })

    let samples = $state([])
    let sampleColors = $state([
        '#2f4f4f','#006400','#b8860b','#4b0082',
        '#ff0000','#c71585','#7fff00','#00fa9a',
        '#00ffff','#0000ff','#ff00ff','#1e90ff',
        '#fa8071'])

    let likelihood = $derived(
        logScale ? samples.reduce((acc, {x}) => acc+currentPdf(x, parameterValues), 0)
        : samples.reduce((acc, {x}) => acc*currentPdf(x, parameterValues), 1)
    )

    function addSample({x}) {
        if(sampleColors.length) {
            samples.push({x, color: sampleColors.pop()})
        }
    }

    function clearSamples() {
        sampleColors.push(...samples.map(({color}) => color))
        samples.length = 0
    }

    function pressParameter(local, evt, vp, param) {
        pressedParameter = param

        pressOffset = (local.x - (parameterValues[param] ?? parameters[param].default))

        evt.currentTarget.setPointerCapture(evt.pointerId);
    }

    function move(local, evt, vp) {
        if(pressedParameter !== null) {
            parameterValues[pressedParameter] = parameters[pressedParameter].clampProject(parameterValues, local.x)
        }
    }

    function release(local, evt, vp) {
        pressedParameter = null
    }

    const parameters = {
        mean: {
            default: 0,
            handles: [meanHandle],
            clampProject(all, newVal) {
                return newVal
            },
            symbol: 'μ',
            name: 'Mean',
            slider: {
                min: -500,
                max: 500,
                project(all, v) {
                    return Math.max(this.min, Math.min(this.max, v))
                },
                unproject(v) {
                    return v
                }
            }
        },
        variance: {
            default: 10,
            clampProject(all, newVal) {
                return Math.pow(newVal-all.mean, 2)
            },
            handles: [varianceHandle],
            symbol: '𝜎²',
            name: 'Variance',
            slider: {
                min: 1,
                max: 100,
                project(all, v) {
                    return Math.pow(Math.max(this.min, Math.min(this.max, v)), 2)
                },
                unproject(v) {
                    return Math.sqrt(v)
                }
            }
        },
        scale: {
            default: 1,
            clampProject(all, newVal) {
                return Math.abs(newVal-all.mean)
            },
            handles: [scaleHandle],
            symbol: 's',
            name: 'Scale',
            slider: {
                min: 0,
                max: 500,
                project(all, v) {
                    return Math.max(this.min, Math.min(this.max, v))
                },
                unproject(v) {
                    return v
                }
            }
        },
        min: {
            default: -1,
            clampProject(all, newVal) {
                return Math.min(all.max, newVal)
            },
            handles: [minMaxHandle],
            symbol: 'a',
            name: 'Min',
            slider: {
                min: -500,
                max: 500,
                project(all, v) {
                    return Math.max(this.min, Math.min(this.max, Math.min(all.max, v)))
                },
                unproject(v) {
                    return v
                }
            },
        },
        max: {
            default: 1,
            clampProject(all, newVal) {
                return Math.max(all.min, newVal)
            },
            handles: [minMaxHandle],
            symbol: 'b',
            name: 'Max',
            slider: {
                min: -500,
                max: 500,
                project(all, v) {
                    return Math.max(this.min, Math.min(this.max, Math.max(all.min, v)))
                },
                unproject(v) {
                    return v
                }
            },
        },
    }

    const distributions = {
        gauss: {
            pdf(x, {mean,variance}) {
                return Math.exp(-0.5*Math.pow(x-mean,2)/variance)/Math.sqrt(2*Math.PI*variance)
            },
            logPdf(x, {mean,variance}) {
                return -0.5*Math.pow(x-mean,2)/variance/8000 - Math.log(Math.sqrt(2*Math.PI*variance))/8000
            },
            get parameters () {
                return ['mean','variance']
            },
            get name () {
                return "Gaußian"
            },
            get color() {
                return 'darkred'
            }
        },
        laplace: {
            pdf(x, {mean,scale}) {
                return Math.exp(-Math.abs((x-mean)/scale))/scale/2
            },
                logPdf(x, {mean,scale}) {
                return -Math.abs((x-mean)/scale)/8000 - Math.log(scale*2)/8000
            },
            get parameters () {
                return ['mean','scale']
            },
            get name () {
                return "Laplace"
            },
            get color() {
                return 'darkgreen'
            }
        },
        uniform: {
            pdf(x, {min,max}) {
                return x>=min && x<=max ? 0.5/(max-min) : 0
            },
            logPdf(x, {min,max}) {
                return x>=min && x<=max ? Math.log(0.5/(max-min))/8000 : -10000
            },
            get parameters () {
                return ['min','max']
            },
            get name () {
                return "Uniform"
            },
            get color() {
                return 'darkblue'
            }
        }
    }
    let currentDistribution = $derived(distributions[distType])
    let currentParameters = $derived(distributions[distType].parameters)
    let currentPdf = $derived(logScale ? distributions[distType].logPdf : distributions[distType].pdf)

    function updateSlider(paramName) {
        return (evt) => {
            const newVal = parameters[paramName].slider.project(parameterValues, evt.currentTarget.value);
            evt.currentTarget.value = newVal
            parameterValues[paramName] = newVal
        }
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

{#snippet meanHandle(viewBox, paramName, mean)}
    {@const adapter = viewBox.svgAdapter}
    <g>
        <circle class="handle" onpointermove={adapter.delegate(move)} onpointerup={adapter.delegate(release)} onpointerdown={adapter.delegate(pressParameter, paramName)} class:state-active={pressedParameter==paramName} fill={currentDistribution.color} cursor="move" cx={mean} cy={80} r="10"></circle>
        <text font-size="0.8em" class="label-text" x={mean} y={80} dominant-baseline="middle" text-anchor="middle" fill="#ffffff">{parameters[paramName].symbol}</text>    
        <text font-size="0.8em" class="label-text" x={mean} y={105} text-anchor="middle" stroke="white" stroke-width="5" paint-order="stroke">{parameters[paramName].name}</text>  
    </g>
{/snippet}

{#snippet varianceHandle(viewBox, paramName, variance, otherParams)}
    {@const adapter = viewBox.svgAdapter}             
    <line stroke-dasharray="3 3" stroke-dashoffset={-Math.sqrt(variance)} stroke="black" x1={otherParams.mean-Math.sqrt(variance)} x2={otherParams.mean+Math.sqrt(variance)} y1={60} y2={60} />
    <g>
        <circle class="handle" onpointermove={adapter.delegate(move)} onpointerup={adapter.delegate(release)} onpointerdown={adapter.delegate(pressParameter, paramName)} class:state-active={pressedParameter==paramName} fill={currentDistribution.color} cursor="move" cx={otherParams.mean - Math.sqrt(variance)} cy={60} r="10"></circle>
    </g>
    <g>
        <circle class="handle" onpointermove={adapter.delegate(move)} onpointerup={adapter.delegate(release)} onpointerdown={adapter.delegate(pressParameter, paramName)} class:state-active={pressedParameter==paramName} fill={currentDistribution.color} cursor="move" cx={otherParams.mean + Math.sqrt(variance)} cy={60} r="10"></circle>
        <text font-size="0.8em" class="label-text" x={otherParams.mean+Math.sqrt(variance)} y={60} dominant-baseline="middle" text-anchor="middle" fill="#ffffff">{parameters[paramName].symbol}</text>    
        <text font-size="0.8em" class="label-text" x={otherParams.mean+Math.sqrt(variance)} y={90} text-anchor="middle" stroke="white" stroke-width="5" paint-order="stroke">{parameters[paramName].name}</text>    
    </g>
{/snippet}

{#snippet scaleHandle(viewBox, paramName, variance, otherParams)}
    {@const adapter = viewBox.svgAdapter}             
    <line stroke-dasharray="3 3" stroke-dashoffset={-(variance)} stroke="black" x1={otherParams.mean-(variance)} x2={otherParams.mean+(variance)} y1={60} y2={60} />
    <g>
        <circle class="handle" onpointermove={adapter.delegate(move)} onpointerup={adapter.delegate(release)} onpointerdown={adapter.delegate(pressParameter, paramName)} class:state-active={pressedParameter==paramName} fill={currentDistribution.color} cursor="move" cx={otherParams.mean - (variance)} cy={60} r="10"></circle>
    </g>
    <g>
        <circle class="handle" onpointermove={adapter.delegate(move)} onpointerup={adapter.delegate(release)} onpointerdown={adapter.delegate(pressParameter, paramName)} class:state-active={pressedParameter==paramName} fill={currentDistribution.color} cursor="move" cx={otherParams.mean + (variance)} cy={60} r="10"></circle>
        <text font-size="0.8em" class="label-text" x={otherParams.mean+(variance)} y={60} dominant-baseline="middle" text-anchor="middle" fill="#ffffff">{parameters[paramName].symbol}</text>    
        <text font-size="0.8em" class="label-text" x={otherParams.mean+(variance)} y={90} text-anchor="middle" stroke="white" stroke-width="5" paint-order="stroke">{parameters[paramName].name}</text>    
    </g>
{/snippet}

{#snippet minMaxHandle(viewBox, paramName, mean)}
    {@const adapter = viewBox.svgAdapter}
    <g>
        <circle class="handle" onpointermove={adapter.delegate(move)} onpointerup={adapter.delegate(release)} onpointerdown={adapter.delegate(pressParameter, paramName)} class:state-active={pressedParameter==paramName} fill={currentDistribution.color} cursor="move" cx={mean} cy={80} r="10"></circle>
        <text font-size="0.8em" class="label-text" x={mean} y={80} dominant-baseline="middle" text-anchor="middle" fill="#ffffff">{parameters[paramName].symbol}</text>    
        <text font-size="0.8em" class="label-text" x={mean} y={105} text-anchor="middle" stroke="white" stroke-width="5" paint-order="stroke">{parameters[paramName].name}</text>  
    </g>
{/snippet}

{#snippet foo()}
    
                            
    <line stroke-dasharray="3 3" stroke-dashoffset={-stdDev} stroke="black" x1={mean-stdDev} x2={mean+stdDev} y1={60} y2={60} />
                        
    <g>
        <circle class="handle" onpointermove={adapter.delegate(move)} onpointerup={adapter.delegate(release)} onpointerdown={adapter.delegate(pressMean)} class:state-active={pressedMean} fill={currentDistribution.color} cursor="move" cx={mean} cy={80} r="10"></circle>
        <text class="label-text" x={mean} y={80} dominant-baseline="middle" text-anchor="middle" fill="#ffffff">&mu;</text>    
        <text font-size="0.8em" class="label-text" x={mean} y={105} text-anchor="middle" stroke="white" stroke-width="5" paint-order="stroke">Mean</text>  
    </g>
    <g>
        <circle class="handle" onpointermove={adapter.delegate(move)} onpointerup={adapter.delegate(release)} onpointerdown={adapter.delegate(pressStdDev, -1)} class:state-active={pressedStdDev} fill={currentDistribution.color} cursor="move" cx={mean - stdDev} cy={60} r="10"></circle>
    </g>
    <g>
        <circle class="handle" onpointermove={adapter.delegate(move)} onpointerup={adapter.delegate(release)} onpointerdown={adapter.delegate(pressStdDev, 1)} class:state-active={pressedStdDev} fill={currentDistribution.color} cursor="move" cx={mean + stdDev} cy={60} r="10"></circle>
        <text class="label-text" x={mean+stdDev} y={60} dominant-baseline="middle" text-anchor="middle" fill="#ffffff">&sigma;</text>    
        <text font-size="0.8em" class="label-text" x={mean+stdDev} y={90} text-anchor="middle" stroke="white" stroke-width="5" paint-order="stroke">StdDev</text>    
    </g>
{/snippet}

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

                <h2>Parameters</h2>
                {#each currentParameters as param(param)}
                     <div style="display: grid;">
                        <label for="">{parameters[param].name} ({parameters[param].symbol})</label>
                        <input style:accent-color={currentDistribution.color} type="range" oninput={updateSlider(param)} value={parameters[param].slider.unproject(parameterValues[param])} min={parameters[param].slider.min} max={parameters[param].slider.max} />
                     </div>
                {/each}

                <h3>View</h3>

                <div>
                    Probability Scale:<br>
                    <label><input type="radio" value={false} bind:group={logScale} /> Linear</label>
                    <label><input type="radio" value={true} bind:group={logScale} /> Log</label>
                </div>
    
                <div>
                    Likelihood: {decimalFormat.format(likelihood)}
                </div>
    
                <h3>Debug</h3>
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
                        <polyline class="plot-area" fill-opacity="0.1" fill={currentDistribution.color} stroke="none" stroke-width="2" points={`${adapter.visibleMin.x+axisPadding},0,`+join(",", map(adapter.linspaceX(axisPadding), x => `${x},${yScale*currentPdf(x,parameterValues)}`))+`,${adapter.visibleMax.x-axisPadding},0`} />
                        <polyline class="plot-line" fill="none" stroke={currentDistribution.color} stroke-width="2" points={join(",", map(adapter.linspaceX(axisPadding), x => `${x},${yScale*currentPdf(x,parameterValues)}`))} />
                    </g>
                    <g>
                        <rect cursor="copy" fill-opacity="0.2" fill="#ffaa00" x={adapter.visibleMin.x+axisPadding} y={0}  width={adapter.visibleWidth-2*axisPadding} height={40} onpointerdown={adapter.delegate(addSample)} />
                        <text x={adapter.visibleMin.x + 20} y={20} dominant-baseline="middle">Samples</text>
                    </g>
                    <g pointer-events="none">
                        {#each samples as {x,color}}
                        <circle cx={x} cy={20} r="5" fill={color}></circle>
                        <circle cx={x} cy={yScale*currentPdf(x, parameterValues)} r="2" fill={color}></circle>
                        <line x1={x} y1={0} x2={x} y2={yScale*currentPdf(x, parameterValues)} stroke={color}></line>
                        {/each}
                    </g>

                    
                    {#each currentParameters as param}
                        {#each parameters[param].handles as h}
                            {@render h(viewport, param, parameterValues[param], parameterValues)}
                        {/each}
                    {/each}
                {/if}
            {/snippet}
        </Canvas>
    </div>
</div>

