
<title>Posterior</title>

<script>
  import Canvas from '../lib/Canvas.svelte'
  import {Viewport, ReactiveViewport} from '../lib/viewport.js'
  import {join, map} from '../lib/utils.js'
  import {distributions, parameters} from '../lib/distributions.js'

    const pdfScaleFactor = 1
    const decimalFormat = new Intl.NumberFormat("en-US", {notation: "scientific",});

    let reactiveVP = new ReactiveViewport()

    const parameterHandles = {
        mean: [meanHandle],
        variance: [varianceHandle],
        scale: [scaleHandle],
        min: [minMaxHandle],
        max: [minMaxHandle],
        degree: [degreeHandle],
    }
    
    const id = (x) => x
    const squareDist2 = (m) => (x) => Math.pow(x-m, 2)

    let debug = $state(false)
    let pressedParameter = $state(null)
    let distType = $state('gauss')
    let pressOffset = $state(0)
    let logScale = $state(false)

    let parameterValues = $state(Object.fromEntries(
        Object.entries(parameters).map(([k,p]) => [
            k, p.default
        ])
    ))

    let parameterPriorDistTypes = $state(Object.fromEntries(
        Object.entries(parameters).map(([k,p]) => [
            k, null
        ])
    ))

    let parameterPriorDistParams = $state(Object.fromEntries(
        Object.entries(parameters).map(([k,p]) => [
            k, Object.fromEntries(
                Object.entries(parameters).map(([k,p]) => [
                    k, p.default
                ])
            )
        ])
    ))

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

    function pressParameter(local, evt, vp, param, mirror=1) {
        pressedParameter = param

        pressOffset = (mirror*local.x - parameters[pressedParameter].handleProject(parameterValues, parameterValues[param] ?? parameters[param].default) - parameters[pressedParameter].renderOffset(parameterValues))

        evt.currentTarget.setPointerCapture(evt.pointerId);
    }

    function move(local, evt, vp, mirror=1) {
        if(pressedParameter !== null) {
            parameterValues[pressedParameter] = parameters[pressedParameter].clampProject(parameterValues, parameters[pressedParameter].handleUnProject(parameterValues, (mirror*local.x - pressOffset) - parameters[pressedParameter].renderOffset(parameterValues)))
        }
    }

    function release(local, evt, vp) {
        pressedParameter = null
    }

    
    function scalePdf(pdf, scale) {
        return (x,...args) => {
            return pdf(x/scale,...args)/scale
        }
    }

    let currentDistribution = $derived(distributions[distType])
    let currentParameters = $derived(distributions[distType].parameters)
    let currentPdf = $derived(scalePdf(logScale ? distributions[distType].logPdf : distributions[distType].pdf, pdfScaleFactor))

    function updateSlider(paramName, valueBag) {
        return (evt) => {
            const newVal = parameters[paramName].slider.project(valueBag, evt.currentTarget.value);
            evt.currentTarget.value = newVal
            valueBag[paramName] = newVal
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
        vector-effect: non-scaling-stroke;
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

    :global(label, button, input, select, textarea) {
        pointer-events: all;
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
        margin: 1em;
    }

    .prior-config {
        padding: 0.5em;
        background-color: #0003;
        margin: 0.2em;
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

{#snippet varianceHandle(viewBox, paramName, variance, relativeOffset)}
    {@const adapter = viewBox.svgAdapter}             
    <line stroke="black" x1={relativeOffset} x2={relativeOffset} y1={65} y2={55} />
    <line stroke-dasharray="3 3" stroke-dashoffset={-(variance)} stroke="black" x1={relativeOffset-(variance)} x2={relativeOffset+(variance)} y1={60} y2={60} />
    <g>
        <circle class="handle" onpointermove={adapter.delegate(move, -1)} onpointerup={adapter.delegate(release)} onpointerdown={adapter.delegate(pressParameter, paramName, -1)} class:state-active={pressedParameter==paramName} fill={currentDistribution.color} cursor="move" cx={relativeOffset - (variance)} cy={60} r="10"></circle>
    </g>
    <g>
        <circle class="handle" onpointermove={adapter.delegate(move)} onpointerup={adapter.delegate(release)} onpointerdown={adapter.delegate(pressParameter, paramName)} class:state-active={pressedParameter==paramName} fill={currentDistribution.color} cursor="move" cx={relativeOffset + (variance)} cy={60} r="10"></circle>
        <text font-size="0.8em" class="label-text" x={relativeOffset+(variance)} y={60} dominant-baseline="middle" text-anchor="middle" fill="#ffffff">{parameters[paramName].symbol}</text>    
        <text font-size="0.8em" class="label-text" x={relativeOffset+(variance)} y={90} text-anchor="middle" stroke="white" stroke-width="5" paint-order="stroke">{parameters[paramName].name}</text>    
    </g>
{/snippet}

{#snippet scaleHandle(viewBox, paramName, variance, relativeOffset)}
    {@const adapter = viewBox.svgAdapter}             
    <line stroke="black" x1={relativeOffset} x2={relativeOffset} y1={65} y2={55} />
    <line stroke-dasharray="3 3" stroke-dashoffset={-(variance)} stroke="black" x1={relativeOffset-(variance)} x2={relativeOffset+(variance)} y1={60} y2={60} />
    <g>
        <circle class="handle" onpointermove={adapter.delegate(move)} onpointerup={adapter.delegate(release)} onpointerdown={adapter.delegate(pressParameter, paramName)} class:state-active={pressedParameter==paramName} fill={currentDistribution.color} cursor="move" cx={relativeOffset - (variance)} cy={60} r="10"></circle>
    </g>
    <g>
        <circle class="handle" onpointermove={adapter.delegate(move)} onpointerup={adapter.delegate(release)} onpointerdown={adapter.delegate(pressParameter, paramName)} class:state-active={pressedParameter==paramName} fill={currentDistribution.color} cursor="move" cx={relativeOffset + (variance)} cy={60} r="10"></circle>
        <text font-size="0.8em" class="label-text" x={relativeOffset+(variance)} y={60} dominant-baseline="middle" text-anchor="middle" fill="#ffffff">{parameters[paramName].symbol}</text>    
        <text font-size="0.8em" class="label-text" x={relativeOffset+(variance)} y={90} text-anchor="middle" stroke="white" stroke-width="5" paint-order="stroke">{parameters[paramName].name}</text>    
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

{#snippet degreeHandle(viewBox, paramName, degree)}
    {@const adapter = viewBox.svgAdapter}
    <g>
        <circle class="handle" onpointermove={adapter.delegate(move)} onpointerup={adapter.delegate(release)} onpointerdown={adapter.delegate(pressParameter, paramName)} class:state-active={pressedParameter==paramName} fill={currentDistribution.color} cursor="move" cx={degree} cy={80} r="10"></circle>
        <text font-size="0.8em" class="label-text" x={degree} y={80} dominant-baseline="middle" text-anchor="middle" fill="#ffffff">{parameters[paramName].symbol}</text>    
        <text font-size="0.8em" class="label-text" x={degree} y={105} text-anchor="middle" stroke="white" stroke-width="5" paint-order="stroke">{parameters[paramName].name}</text>  
    </g>
{/snippet}


<div class="grid">
    <div class="hud">
        <div class="ontop">
            <div class="controls">
                <div>
                    Distribution:<br>
                    <select bind:value={distType}>
                        {#each Object.entries(distributions) as [c, d]}
                            <option value={c}>{d.name}</option>
                        {/each}
                    </select>
                </div>

                <h2>Parameters</h2>
                {#each currentParameters as param(param)}
                     <div style="display: grid;">
                        <label for="">{parameters[param].name} ({parameters[param].symbol})</label>
                        <input style:accent-color={currentDistribution.color} type="range" step={parameters[param].slider.step} oninput={updateSlider(param, parameterValues)} value={parameters[param].slider.unproject(parameterValues[param])} min={parameters[param].slider.min} max={parameters[param].slider.max} />
                        <div class="prior-config">Prior:
                            <select bind:value={parameterPriorDistTypes[param]}>
                                <option value={null}>None</option>
                                {#each parameters[param].priors as c}
                                    <option value={c}>{distributions[c].name}</option>
                                {/each}
                            </select>
                            {#if parameterPriorDistTypes[param]}
                            {#each distributions[parameterPriorDistTypes[param]].parameters as priorParam(priorParam)}
                                <div style="display: grid;">
                                    <label for="">{parameters[priorParam].name} ({parameters[priorParam].symbol})</label>
                                    <input type="range" style:accent-color={parameters[param].color} oninput={updateSlider(priorParam, parameterPriorDistParams[param])} value={parameters[priorParam].slider.unproject(parameterPriorDistParams[param][priorParam])} min={parameters[priorParam].slider.min} max={parameters[priorParam].slider.max} />
                                </div>
                            {/each}
                            {/if}
                        </div>
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
                        y1={adapter.visibleMin.y+axisPadding} y2={0*(adapter.visibleMax.y-axisPadding)+axisPadding}></line>
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
                    {#each currentParameters.filter((param) => parameterPriorDistTypes[param]) as param, i (param)}
                        {@const paramDistType = parameterPriorDistTypes[param]}
                        {#if paramDistType }
                            {@const currentDistribution = distributions[paramDistType]}
                            {@const currentPdf = scalePdf(logScale ? distributions[paramDistType].logPdf : distributions[paramDistType].pdf, pdfScaleFactor)}
                            {@const vOffset = 180 + 100*i}
                            {@const hOffset = parameters[param].renderOffset(parameterValues)}
                            <g>
                                <text x={adapter.visibleMin.x + 20} y={vOffset-10} dominant-baseline="middle">{parameters[param].name} Prior Distribution</text>

                                <polyline class="plot-area" fill-opacity="0.1" fill={parameters[param].color} stroke="none" stroke-width="2" points={`${adapter.visibleMin.x+axisPadding},${vOffset},`+join(",", map(adapter.linspaceX(axisPadding), x => `${x+hOffset},${vOffset+0.2*yScale*currentPdf(x,parameterPriorDistParams[param])}`))+`,${adapter.visibleMax.x-axisPadding},${vOffset}`} />
                                <polyline class="plot-line" fill="none" stroke={parameters[param].color} stroke-width="2" points={`${adapter.visibleMin.x+axisPadding},${vOffset},`+join(",", map(adapter.linspaceX(axisPadding), x => `${x+hOffset},${vOffset+0.2*yScale*currentPdf(x,parameterPriorDistParams[param])}`))+`,${adapter.visibleMax.x-axisPadding},${vOffset}`} />
                                  
                                <g>
                                    <line class="axis-line" stroke="black" x1={hOffset} x2={hOffset} y1={vOffset+10} y2={vOffset-50} />
                                    <line class="axis-line" stroke="black" x1={adapter.visibleMin.x} x2={adapter.visibleMax.x} y1={vOffset} y2={vOffset} />
                                    
                                    <g>
                                        <path class="axis-arrowhead" d="M{adapter.visibleMax.x},{vOffset}l-10,-5v10z" fill="black" />
                                        <path class="axis-arrowhead" d="M{hOffset},{vOffset-50}l-5,10h10z" fill="black" />
                                    </g>
                                </g>

                                <line x1={hOffset+parameters[param].renderProject(parameterValues[param])} y1={vOffset} x2={hOffset+parameters[param].renderProject(parameterValues[param])} y2={vOffset+0.2*yScale*currentPdf(parameters[param].renderProject(parameterValues[param]),parameterPriorDistParams[param])} stroke={parameters[param].color}></line>
                                <circle r="2" cx={hOffset+parameters[param].renderProject(parameterValues[param])} cy={vOffset} fill={parameters[param].color}></circle>
                                <circle r="2" cx={hOffset+parameters[param].renderProject(parameterValues[param])} cy={vOffset+0.2*yScale*currentPdf(parameters[param].renderProject(parameterValues[param]),parameterPriorDistParams[param])} fill={parameters[param].color}></circle>
                            </g>
                        {/if}
                    {/each}
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
                        {#each parameterHandles[param] as h}
                            {@render h(viewport, param, parameters[param].handleProject(parameterValues, parameterValues[param]), parameters[param].renderOffset(parameterValues))}
                        {/each}
                    {/each}
                {/if}
            {/snippet}
        </Canvas>
    </div>
</div>

