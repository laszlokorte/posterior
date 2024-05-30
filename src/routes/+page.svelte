
<title>Posterior</title>

<script>
  import Canvas from '../lib/Canvas.svelte'
  import {Viewport, ReactiveViewport} from '../lib/viewport.js'
  import {join, map, reduce, filter} from '../lib/utils.js'
  import {distributions, parameters} from '../lib/distributions.js'

    const pdfScaleFactor = 1
    const decimalFormat = new Intl.NumberFormat("en-US", {notation: "engineering",});

    let reactiveVP = new ReactiveViewport()

    const parameterHandles = {
        mean: [meanHandle],
        variance: [varianceHandle],
        stdev: [stdevHandle],
        scale: [scaleHandle],
        rate: [rateHandle],
        min: [minMaxHandle],
        max: [minMaxHandle],
        degree: [degreeHandle],
    }
    
    const id = (x) => x
    const squareDist2 = (m) => (x) => (x-m)*(x-m)

    const xResolution = 0.75

    let debug = $state(false)
    let pressedParameter = $state(null)
    let pressedPrior = $state(null)
    let distType = $state('gauss')
    let pressOffset = $state(0)
    let logScale = $state(false)
    let distColors = $state(Object.fromEntries(
        Object.entries(distributions).map(([k,p], i) => [
            k, p.color
        ])
    ))
    let paramColors = $state(Object.fromEntries(
        Object.entries(parameters).map(([k,p], i) => [
            k, p.color
        ])
    ))

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
    let sampleColors = $state(Array(30).fill(null).map((_,i) => `hsl(${(360 * 1.6180339887 * i)%360},90%,50%)`))

    let likelihood = $derived.by(() => {
        const pv = $state.snapshot(parameterValues)
        
        return logScale ? samples.reduce((acc, {x}) => acc+currentPdf(x, pv), 0)
        : samples.reduce((acc, {x}) => acc*currentPdf(x, pv), 1)
    })

    function addSample({x}) {
        if(sampleColors.length) {
            samples.push({x, color: sampleColors.pop()})
        }
        samples.sort(({x: a}, {x: b}) => b - a)
    }

    function clearSamples() {
        sampleColors.push(...samples.map(({color}) => color))
        samples.length = 0
    }

    function pressParameter(local, evt, vp, param, mirror=1, dist) {
        pressedParameter = param
        pressedPrior = dist

        if(dist) {
            pressOffset = (mirror*local.x - parameters[pressedParameter].handleProject(parameterPriorDistParams[dist], parameterPriorDistParams[dist][param] ?? parameters[param].default) - parameters[pressedParameter].renderOffset(parameterPriorDistParams[dist]))
        } else {
            pressOffset = (mirror*local.x - parameters[pressedParameter].handleProject(parameterValues, parameterValues[param] ?? parameters[param].default) - parameters[pressedParameter].renderOffset(parameterValues))
        }

        evt.currentTarget.setPointerCapture(evt.pointerId);
    }

    function move(local, evt, vp, mirror=1) {
        if(pressedParameter !== null) {
            if(pressedPrior !== null) {
                parameterPriorDistParams[pressedPrior][pressedParameter] = parameters[pressedParameter].clampProject(parameterPriorDistParams[pressedPrior], parameters[pressedParameter].handleUnProject(parameterPriorDistParams[pressedPrior], (mirror*local.x - pressOffset) - parameters[pressedParameter].renderOffset(parameterPriorDistParams[pressedPrior])))
            } else {
                parameterValues[pressedParameter] = parameters[pressedParameter].clampProject(parameterValues, parameters[pressedParameter].handleUnProject(parameterValues, (mirror*local.x - pressOffset) - parameters[pressedParameter].renderOffset(parameterValues)))
            }
        }
    }

    function release(local, evt, vp) {
        pressedParameter = null
        pressedPrior = null
    }

    
    function scalePdf(pdf, scale) {
        return (x,...args) => {
            return pdf(x/scale,...args)/scale
        }
    }

    let currentDistribution = $derived(distributions[distType])
    let currentParameters = $derived(currentDistribution.parameters)
    let currentPdf = $derived($state.snapshot(logScale ? currentDistribution.logPdf : currentDistribution.pdf))

    const currentLikelihood = $derived.by(() => {
        const pvs = $state.snapshot(parameterValues)
        const cpdf = $state.snapshot(currentPdf)
        const smpls = $state.snapshot(samples)

        return (p, pv) => {
            const pvsInner = $state.snapshot({...pvs, [p]: pv})
            return smpls.reduce((acc, {x}) => {
                if(acc === 0) {
                    return 0
                }
                const nv = acc*cpdf(x, pvsInner);
                if(isNaN(nv)) {
                    return 0
                }
                return nv
            }, Math.exp(samples.length))
        }
    })

    let paramsWithPrior = $derived(currentParameters
        .filter((param) => parameterPriorDistTypes[param])
        .map((param) => {
            const paramDistType = parameterPriorDistTypes[param]
            const currentDistribution = distributions[paramDistType]
            const currentPdf = logScale ? distributions[paramDistType].logPdf : distributions[paramDistType].pdf
            
            return currentPdf(parameters[param].renderProject(parameterValues[param])/pdfScaleFactor, parameterPriorDistParams[param])
        })
    )
    let currentPrior = $derived.by(() => {
        const ls = $state.snapshot(logScale)
        return paramsWithPrior.length ? paramsWithPrior.reduce((acc, p) => ls ? acc + p : acc * p, 1) : null
    })


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

    .color-swatch {
        padding: 0;
        width: 1.2em;
        height: 1.2em;
        border: none;
        display: inline-block;
        vertical-align: middle;
        margin: 0.2em;
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
        stroke-linejoin: round;
    }

    .hud {
        display: grid;
        grid-template-rows: 1fr;
        grid-template-columns: [side-start] 20em [side-end body-start] 1fr [body-end];
        place-content: stretch;
        place-items: stretch;
        gap: 0.5em;
    }

    .hud > :global(*) {
        grid-column: body;
        grid-row: 1 / 1;
    }

    .ontop {
        grid-column: side;
        display: grid;
        place-content: stretch;
        z-index: 1;
        pointer-events: none;
        height: 100%;
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
        background-color: #f0f0f0;
        padding: 1em;
        margin: 1em;
        border: 3px solid #555;
        width: 100%;
        box-sizing: border-box;
        overflow: auto;
        max-height: 90vh;
        pointer-events: all;
    }

    .prior-config {
        padding: 0.5em;
        background-color: #0003;
        margin: 0.2em;
    }

    .choice-box {
        display: grid;
    }

    .slider-box {
        margin-top: 0.5em;
        display: grid;
    }


    .slider-label {
        font-weight: bold;
    }

    h1, h2, h3 {
        margin: 0;
    }

    h1 {
        font-size: 1.3em;
        margin-bottom: 1em;
    }

    .control-head {
        margin-top: 1em;
        display: flex;
        justify-content: space-between;
    }

    .choice-label {
        font-weight: bold;
    }

    summary {
        cursor: default;
    }

    hr {
        border: none;
        border-top: 1px solid #aaa;
    }
</style>

{#snippet meanHandle(color, viewBox, paramName, mean, relativeOffset, showLabel, dist)}
    {@const adapter = viewBox.svgAdapter}
    <g>
        <circle class="handle" onpointermove={adapter.delegate(move)} onpointerup={adapter.delegate(release)} onpointerdown={adapter.delegate(pressParameter, paramName, 1, dist)} class:state-active={pressedParameter==paramName} fill={color} cursor="move" cx={mean} cy={20} r="10"></circle>
        <text font-size="0.8em" class="label-text" x={relativeOffset+mean} y={20} dominant-baseline="middle" text-anchor="middle" fill="#ffffff">{parameters[paramName].symbol}</text>    
        {#if showLabel}
        <text font-size="0.8em" class="label-text" x={relativeOffset+mean+ 15} y={20} dominant-baseline="middle" text-anchor="start" stroke="white" stroke-width="5" paint-order="stroke">{parameters[paramName].name}</text>  
        {/if}
    </g>
{/snippet}


{#snippet varianceHandle(color, viewBox, paramName, variance, relativeOffset, showLabel, dist)}
    {@const adapter = viewBox.svgAdapter}             
    <line stroke="black" x1={relativeOffset} x2={relativeOffset} y1={-5} y2={5} />
    <line stroke-dasharray="3 3" stroke-dashoffset={-(variance)} stroke="black" x1={relativeOffset-(variance)} x2={relativeOffset+(variance)} y1={0} y2={0} />
    <g>
        <circle class="handle" onpointermove={adapter.delegate(move, -1)} onpointerup={adapter.delegate(release)} onpointerdown={adapter.delegate(pressParameter, paramName, -1, dist)} class:state-active={pressedParameter==paramName} fill={color} cursor="move" cx={relativeOffset - (variance)} cy={0} r="10"></circle>
    </g>
    <g>
        <circle class="handle" onpointermove={adapter.delegate(move)} onpointerup={adapter.delegate(release)} onpointerdown={adapter.delegate(pressParameter, paramName, 1, dist)} class:state-active={pressedParameter==paramName} fill={color} cursor="move" cx={relativeOffset + (variance)} cy={0} r="10"></circle>
        <text font-size="0.8em" class="label-text" x={relativeOffset+(variance)} y={0} dominant-baseline="middle" text-anchor="middle" fill="#ffffff">{parameters[paramName].symbol}</text>   
        {#if showLabel} 
        <text font-size="0.8em" class="label-text" x={relativeOffset+(variance)} y={30} text-anchor="start" stroke="white" stroke-width="5" paint-order="stroke">{parameters[paramName].name}</text>    
        {/if}
    </g>
{/snippet}

{#snippet stdevHandle(color, viewBox, paramName, stdev, relativeOffset, showLabel, dist)}
    {@const adapter = viewBox.svgAdapter}             
    <line stroke="black" x1={relativeOffset} x2={relativeOffset} y1={-5} y2={5} />
    <line stroke-dasharray="3 3" stroke-dashoffset={-(stdev)} stroke="black" x1={relativeOffset-(stdev)} x2={relativeOffset+(stdev)} y1={0} y2={0} />
    <g>
        <circle class="handle" onpointermove={adapter.delegate(move, -1)} onpointerup={adapter.delegate(release)} onpointerdown={adapter.delegate(pressParameter, paramName, -1, dist)} class:state-active={pressedParameter==paramName} fill={color} cursor="move" cx={relativeOffset - (stdev)} cy={0} r="10"></circle>
    </g>
    <g>
        <circle class="handle" onpointermove={adapter.delegate(move)} onpointerup={adapter.delegate(release)} onpointerdown={adapter.delegate(pressParameter, paramName, 1, dist)} class:state-active={pressedParameter==paramName} fill={color} cursor="move" cx={relativeOffset + (stdev)} cy={0} r="10"></circle>
        <text font-size="0.8em" class="label-text" x={relativeOffset+(stdev)} y={0} dominant-baseline="middle" text-anchor="middle" fill="#ffffff">{parameters[paramName].symbol}</text>   
        {#if showLabel} 
        <text font-size="0.8em" class="label-text" x={relativeOffset+(stdev)+ 15} y={0}  dominant-baseline="middle" text-anchor="start" stroke="white" stroke-width="5" paint-order="stroke">{parameters[paramName].name}</text>    
        {/if}
    </g>
{/snippet}

{#snippet scaleHandle(color, viewBox, paramName, variance, relativeOffset, showLabel, dist)}
    {@const adapter = viewBox.svgAdapter}             
    <line stroke="black" x1={relativeOffset} x2={relativeOffset} y1={-5} y2={5} />
    <line stroke-dasharray="3 3" stroke-dashoffset={-(variance)} stroke="black" x1={relativeOffset-(variance)} x2={relativeOffset+(variance)} y1={0} y2={0} />
    <g>
        <circle class="handle" onpointermove={adapter.delegate(move,-1)} onpointerup={adapter.delegate(release)} onpointerdown={adapter.delegate(pressParameter, paramName, -1, dist)} class:state-active={pressedParameter==paramName} fill={color} cursor="move" cx={relativeOffset - (variance)} cy={0} r="10"></circle>
    </g>
    <g>
        <circle class="handle" onpointermove={adapter.delegate(move, +1)} onpointerup={adapter.delegate(release)} onpointerdown={adapter.delegate(pressParameter, paramName, +1, dist)} class:state-active={pressedParameter==paramName} fill={color} cursor="move" cx={relativeOffset + (variance)} cy={0} r="10"></circle>
        <text font-size="0.8em" class="label-text" x={relativeOffset+(variance)} y={0} dominant-baseline="middle" text-anchor="middle" fill="#ffffff">{parameters[paramName].symbol}</text>    
        {#if showLabel}
        <text font-size="0.8em" class="label-text" x={relativeOffset+(variance) + 15} y={0} dominant-baseline="middle" text-anchor="start" stroke="white" stroke-width="5" paint-order="stroke">{parameters[paramName].name}</text>   
        {/if} 
    </g>
{/snippet}

{#snippet rateHandle(color, viewBox, paramName, rate, relativeOffset, showLabel, dist)}
    {@const adapter = viewBox.svgAdapter}             
    <line stroke="black" x1={relativeOffset} x2={relativeOffset} y1={-5} y2={5} />
    <line stroke-dasharray="3 3" stroke-dashoffset={0} stroke="black" x1={relativeOffset} x2={relativeOffset+(rate)} y1={0} y2={0} />
    <g>
        <circle class="handle" onpointermove={adapter.delegate(move, +1)} onpointerup={adapter.delegate(release)} onpointerdown={adapter.delegate(pressParameter, paramName, +1, dist)} class:state-active={pressedParameter==paramName} fill={color} cursor="move" cx={relativeOffset + (rate)} cy={0} r="10"></circle>
        <text font-size="0.8em" class="label-text" x={relativeOffset+(rate)} y={0} dominant-baseline="middle" text-anchor="middle" fill="#ffffff">{parameters[paramName].symbol}</text>    
        {#if showLabel}
        <text font-size="0.8em" class="label-text" x={relativeOffset+(rate) + 15} y={0} dominant-baseline="middle" text-anchor="start" stroke="white" stroke-width="5" paint-order="stroke">{parameters[paramName].name}</text>   
        {/if} 
    </g>
{/snippet}

{#snippet minMaxHandle(color, viewBox, paramName, value, relativeOffset, showLabel, dist)}
    {@const adapter = viewBox.svgAdapter}
    <g>
        <circle class="handle" onpointermove={adapter.delegate(move)} onpointerup={adapter.delegate(release)} onpointerdown={adapter.delegate(pressParameter, paramName, 1, dist)} class:state-active={pressedParameter==paramName} fill={color} cursor="move" cx={value + relativeOffset} cy={0} r="10"></circle>
        <text font-size="0.8em" class="label-text" x={value + relativeOffset} y={0} dominant-baseline="middle" text-anchor="middle" fill="#ffffff">{parameters[paramName].symbol}</text>
        {#if showLabel}
        {#if parameters[paramName].name == 'Min'}
        <text font-size="0.8em" class="label-text" x={value + relativeOffset - 15} y={0} dominant-baseline="middle" text-anchor="end" stroke="white" stroke-width="5" paint-order="stroke">{parameters[paramName].name}</text>  
        {:else}
        <text font-size="0.8em" class="label-text" x={value + relativeOffset + 15} y={0} dominant-baseline="middle" text-anchor="start" stroke="white" stroke-width="5" paint-order="stroke">{parameters[paramName].name}</text>  
        {/if}
        {/if}
    </g>
{/snippet}

{#snippet degreeHandle(color, viewBox, paramName, degree, relativeOffset, showLabel, dist)}
    {@const adapter = viewBox.svgAdapter}
    <g>
        <circle class="handle" onpointermove={adapter.delegate(move)} onpointerup={adapter.delegate(release)} onpointerdown={adapter.delegate(pressParameter, paramName, 1, dist)} class:state-active={pressedParameter==paramName} fill={color} cursor="move" cx={degree + relativeOffset} cy={0} r="10"></circle>
        <text font-size="0.8em" class="label-text" x={degree + relativeOffset} y={0} dominant-baseline="middle" text-anchor="middle" fill="#ffffff">{parameters[paramName].symbol}</text>    
        {#if showLabel}
        <text font-size="0.8em" class="label-text" x={degree + relativeOffset + 15} y={0}  dominant-baseline="middle" text-anchor="start" stroke="white" stroke-width="5" paint-order="stroke">{parameters[paramName].name}</text>  
        {/if}
    </g>
{/snippet}


<div class="grid">
    <div class="hud">
        <div class="ontop">
            <div class="controls">
                <h1>Parameter Estimation</h1>
                <details>
                    <summary>Introduction</summary>
                    <p>
                        The goal in parameter estimation is to summarize observations (samples) and assumtions (priors) in form of model that itself is a distribution. Depending on the kind of distribution various parameters can be adjusted. This is done in a way to fit the observations as best as possible, and in the case of a bayesian perspective also the prior assumptions.
                    </p>
                    <p>
                        The kind of model itself is also an (often discrete) hyper-parameter and can be choosen to best fit the observations and domain knowledge.
                    </p>
                    <p>
                        Click on the yellow shaded area below the horitontal axis on the right to <em>place some sample points</em> as you like. These represent some measurements you have taken. Then select a <em>model distribution</em> and adjust its parameters to fit the sample points as best as possible.
                    </p>
                    <p>
                        Instead of only fitting the sample points, you can also introduce your own assumtions (prior knowledge) into the model building by setting a prior distribution for each parameter. These prior distributions describe how strong you expect a parameter value to in a specific range. For the best effect you configure your priors <em>before you place you sample points</em>.
                    </p>
                    <p>
                        Then when adjusting the model parameters try to <em>not only</em> fit he sample points <em>but also</em> achieve a high probability in your prior distributions.
                    </p>
                </details>
                <hr>
                <label class="choice-box">
                    <h3><span class="choice-label">Model Distribution:</span></h3>
                    <select bind:value={distType}>
                        {#each Object.entries(distributions) as [c, d]}
                            <option value={c}>{d.name}</option>
                        {/each}
                    </select>
                </label>

                <h3 class="control-head"><label><input type="color" class="color-swatch" bind:value={distColors[distType]} />Model Parameters</label></h3>
                {#each currentParameters as param(param)}
                     <div style="display: grid;">
                        <label class="slider-box">
                            <span class="slider-label">{parameters[param].name} ({parameters[param].symbol})</span>
                            <input style:accent-color={distColors[distType]} type="range" step={parameters[param].slider.step} oninput={updateSlider(param, parameterValues)} value={parameters[param].slider.unproject(parameterValues[param])} min={parameters[param].slider.min} max={parameters[param].slider.max} />
                        </label>
                        <div class="prior-config">
                            <span class="choice-box">
                                <span class="choice-label"><input type="color" class="color-swatch" bind:value={paramColors[param]} />{parameters[param].symbol} Prior Distribution:</span>
                                <select bind:value={parameterPriorDistTypes[param]}>
                                    <option value={null}>None</option>
                                    {#each parameters[param].priors as c}
                                        <option value={c}>{distributions[c].name}</option>
                                    {/each}
                                </select>
                            </span>
                            {#if parameterPriorDistTypes[param]}
                            {#each distributions[parameterPriorDistTypes[param]].parameters as priorParam(priorParam)}
                                <label class="slider-box">
                                    <span class="slider-label">{parameters[priorParam].name} ({parameters[priorParam].symbol})</span>
                                    <input type="range"  step={parameters[priorParam].slider.step} style:accent-color={paramColors[param]} oninput={updateSlider(priorParam, parameterPriorDistParams[param])} value={parameters[priorParam].slider.unproject(parameterPriorDistParams[param][priorParam])} min={parameters[priorParam].slider.min} max={parameters[priorParam].slider.max} />
                                </label>
                            {/each}
                            {/if}
                        </div>
                    </div>
                {/each}

                <h2 class="control-head">Samples
                    {#if samples.length}
                     <button onclick={clearSamples}>Clear</button>
                    {/if}
                </h2>

                {#if !samples.length}
                    <p>
                        Click on the light orange bar below the horizotal axis to create samples. Samples are required to determine the likelihood for the current parameter values.
                    </p>
                {:else}
                    <p>
                        Samples: {samples.length} / {samples.length + sampleColors.length}
                    </p>
                {/if}

                {#if samples.length}
                <h2 class="control-head">Current Likelihood</h2>

                <p>
                    The likelihood is the probability of observing the given data (samples), under the assumtion the choosen parameters. To fit the data as good as possible the parameters are to be adjusted to maximize the likelihood.
                </p>

                <p>
                    For the current parameter configuration the likelihood of observing the collected samples is: 
                    <strong> {decimalFormat.format(likelihood)}</strong>
                </p>
                {/if}

                <h2 class="control-head">Current Prior</h2>
                {#if paramsWithPrior.length == currentParameters.length}
                <p>
                    You have specified prior distributions for all parameters. This corresponds to a bayesian appraoch to statistics.
                </p>
                <p>
                    Now try to adjust the model parameters to achieve both a high likelihood, as well as high prior probabilities.
                </p>
                {:else if paramsWithPrior.length==0}
                <p>
                    You have not specified any prior distributions for the parameters. Not specifying any priors corresponds to an frequentist approach to statistics.
                </p>
                <p>
                    From this perspective the collected data points (samples) are the only influence on the choice of model parameters.
                </p>
                <p>
                    <strong>Try to specify a prior distribution for each parameter to describe your assumtion regarding the parameters value.</strong>
                </p>
                {:else}
                <p>
                    You have specified prior distributions for some of the parameters. Now the goal for the adjusting the model parameters is not only to maximize the likelihood, but also the prior probability. This is the bayesian perspective on statistics. 
                </p>
                <p>But you have not defined priors for all the parameters yet. Try express your assumptions regarding every single parameter to become a super-bayesian.</p>
                {/if}
                {#if currentPrior !== null}
                <p>
                    Given the selected prior distributions for the parameters, the prior for current parameter values is is:<br>
                    <strong>{decimalFormat.format(currentPrior)}</strong>
                </p>
                {/if}
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
                        <text x={adapter.visibleMax.x-20} y="-10" text-anchor="end">Observation</text>
                        <text transform-origin="-5 {adapter.visibleMin.y+20}" transform="rotate(-90)" y={adapter.visibleMin.y+20} x="-5" text-anchor="end">Model PDF</text>
                    </g>
                    <g>
                        <path class="axis-arrowhead" d="M{adapter.visibleMax.x},0l-10,-5v10z" fill="black" />
                        <path class="axis-arrowhead" d="M0,{adapter.visibleMin.y}l-5,10h10z" fill="black" />
                    </g>
                    <g>
                        <polyline class="plot-area" fill-opacity="0.1" fill={distColors[distType]} stroke="none" stroke-width="2" points={`${adapter.visibleMin.x+axisPadding},0,`+join(",", map(adapter.linspaceX(axisPadding, xResolution), x => `${x},${yScale*currentPdf(x,parameterValues)}`))+`,${adapter.visibleMax.x-axisPadding},0`} />
                        <polyline class="plot-line" fill="none" stroke={distColors[distType]} stroke-width="2" points={join(",", map(adapter.linspaceX(axisPadding, xResolution), x => `${x},${yScale*currentPdf(x,parameterValues)}`))} />
                    </g>
                    {#each currentParameters.filter((param) => parameterPriorDistTypes[param]) as param, i (param)}
                        {@const paramDistType = parameterPriorDistTypes[param]}
                        {@const currentDistribution = distributions[paramDistType]}
                        {@const currentPdf = $state.snapshot(logScale ? distributions[paramDistType].logPdf : distributions[paramDistType].pdf)}
                        {@const vOffset = 170 + 70*(2*i+1)}
                        {@const hOffset = parameters[param].renderOffset(parameterValues)}
                        {@const priorValues = [...map(adapter.linspaceX(axisPadding, xResolution), x => [x, currentPdf(x-hOffset,parameterPriorDistParams[param])])] }
                        {@const maxPrior = (reduce(0, Math.max, map(priorValues, ([_,y]) => y))*100 || 1)}

                        <g pointer-events="none">
                            <text font-size="0.8em" x={hOffset + 5} y={vOffset+10} dominant-baseline="middle">Prior Dist. of {parameters[param].name} ({parameters[param].symbol})</text>

                            <polyline class="plot-area" fill-opacity="0.1" fill={paramColors[param]} stroke="none" stroke-width="2" points={`${adapter.visibleMin.x+axisPadding},${vOffset},`+join(",", map(priorValues, ([x,y]) => `${x},${vOffset+0.2*yScale*y/maxPrior}`))+`,${adapter.visibleMax.x-axisPadding},${vOffset}`} />
                            <polyline class="plot-line" fill="none" stroke={paramColors[param]} stroke-width="2" points={join(",", map(priorValues, ([x,y]) => `${x},${vOffset+0.2*yScale*y/maxPrior}`))} />
                                
                            <g>
                                <line class="axis-line" stroke="black" x1={hOffset} x2={hOffset} y1={vOffset+10} y2={vOffset-40} />
                                <line class="axis-line" stroke="black" x1={adapter.visibleMin.x} x2={adapter.visibleMax.x} y1={vOffset} y2={vOffset} />
                                
                                <g>
                                    <path class="axis-arrowhead" d="M{adapter.visibleMax.x},{vOffset}l-10,-5v10z" fill="black" />
                                    <path class="axis-arrowhead" d="M{hOffset},{vOffset-40}l-5,10h10z" fill="black" />
                                </g>
                            </g>

                            <line x1={hOffset+parameters[param].renderProject(parameterValues[param])} y1={vOffset} x2={hOffset+parameters[param].renderProject(parameterValues[param])} y2={vOffset+0.2*yScale/maxPrior*currentPdf(parameters[param].renderProject(parameterValues[param]),parameterPriorDistParams[param])} stroke={paramColors[param]}></line>
                            <circle r="2" cx={hOffset+parameters[param].renderProject(parameterValues[param])} cy={vOffset} fill={paramColors[param]}></circle>
                            <circle r="2" cx={hOffset+parameters[param].renderProject(parameterValues[param])} cy={vOffset+0.2*yScale/maxPrior*currentPdf(parameters[param].renderProject(parameterValues[param]),parameterPriorDistParams[param])} fill={paramColors[param]}></circle>
                        </g>

                        <g transform="translate(0, {vOffset-14})">
                            {#each currentDistribution.parameters as priorParam}
                                {@const pv = $state.snapshot(parameterPriorDistParams[param][priorParam])}
                                {#each parameterHandles[priorParam] as h}
                                    {@render h(paramColors[param], viewport, priorParam, parameters[priorParam].handleProject(parameterPriorDistParams[param], pv), hOffset + parameters[priorParam].renderOffset(parameterPriorDistParams[param]), false, param)}
                                {/each}
                            {/each}
                        </g>
                    {/each}

                    {#each currentParameters as param, i (param)}
                        {@const vOffset = 170 + 70*(i*2)}
                        {@const hOffset = parameters[param].renderOffset(parameterValues)}
                        {@const clh = $state.snapshot(currentLikelihood)}
                        {@const pv = $state.snapshot(parameterValues[param])}
                        {@const parameters_param = $state.snapshot(parameters[param])}
                        {@const likelihoodValues = [...map(map(adapter.linspaceX(axisPadding, xResolution), x => [x, parameters_param.renderUnProject(x-hOffset)]), ([x, rx]) => [x, parameters_param.isInRange(rx) ? clh(param, rx) : 0])] }
                        {@const maxLikl = (reduce(0, Math.max, map(likelihoodValues, ([_,y]) => y))*100 || 1)}
                        <g pointer-events="none">
                            <text font-size="0.8em" x={hOffset + 5} y={vOffset+10} dominant-baseline="middle">Likelihood Dist. of {parameters_param.name} ({parameters_param.symbol})</text>
                            <polyline class="plot-area" fill-opacity="0.1" fill={paramColors[param]} stroke="none" stroke-width="2" points={`${adapter.visibleMin.x+axisPadding},${vOffset},`+join(",", map(likelihoodValues, ([x,y]) => `${x},${vOffset+0.2*yScale*y/maxLikl}`))+`,${adapter.visibleMax.x-axisPadding},${vOffset}`} />
                            <polyline class="plot-line" fill="none" stroke={paramColors[param]} stroke-width="2" points={join(",", map(likelihoodValues, ([x,y]) => `${x},${vOffset+0.2*yScale*y/maxLikl}`))} />
                            <g>
                                <line class="axis-line" stroke="black" x1={hOffset} x2={hOffset} y1={vOffset+10} y2={vOffset-40} />
                                <line class="axis-line" stroke="black" x1={adapter.visibleMin.x} x2={adapter.visibleMax.x} y1={vOffset} y2={vOffset} />
                                
                                <g>
                                    <path class="axis-arrowhead" d="M{adapter.visibleMax.x},{vOffset}l-10,-5v10z" fill="black" />
                                    <path class="axis-arrowhead" d="M{hOffset},{vOffset-40}l-5,10h10z" fill="black" />
                                </g>
                            </g>

                            <line x1={hOffset+parameters_param.renderProject(pv)} y1={vOffset} x2={hOffset+parameters_param.renderProject(pv)} y2={vOffset+0.2*yScale*clh(param, pv)/maxLikl} stroke={paramColors[param]}></line>
                            <circle r="2" cx={hOffset+parameters_param.renderProject(pv)} cy={vOffset} fill={paramColors[param]}></circle>
                            <circle r="2" cx={hOffset+parameters_param.renderProject(pv)} cy={vOffset+0.2*yScale*clh(param, pv)/maxLikl} fill={paramColors[param]}></circle>
                        </g>
                    {/each}

                    <g>
                        <rect cursor="copy" fill-opacity="0.2" fill="#ffaa00" x={adapter.visibleMin.x+axisPadding} y={0}  width={adapter.visibleWidth-2*axisPadding} height={40} onpointerdown={adapter.delegate(addSample)} />
                        <text font-size="0.8em" x={adapter.visibleMax.x - 20} y={20} dominant-baseline="middle" text-anchor="end" fill="#aa6600">(Samples)</text>
                        <text font-size="0.8em" x={adapter.visibleMax.x - 20} y={60} dominant-baseline="middle" text-anchor="end">(Model Parameters)</text>
                    </g>

                    <g pointer-events="none">
                        {#each samples as {x,color}}
                        <circle cx={x} cy={20} r="5" fill={color}></circle>
                        <circle cx={x} cy={yScale*currentPdf(x, parameterValues)} r="2" fill={color}></circle>
                        <line x1={x} y1={0} x2={x} y2={yScale*currentPdf(x, parameterValues)} stroke={color}></line>
                        {:else}
                        <text  fill="#aa6600" x="0" y="22" font-size="0.8em" dominant-baseline="middle" text-anchor="middle">Click here to add samples</text>
                        {/each}
                    </g>

                    
                    <g transform="translate(0, 60)">
                    {#each currentParameters as param}
                        {@const pv = $state.snapshot(parameterValues[param])}
                        {#each parameterHandles[param] as h}
                            {@render h(distColors[distType], viewport, param, parameters[param].handleProject(parameterValues, pv), parameters[param].renderOffset(parameterValues), true, null)}
                        {/each}
                    {/each}
                    </g>
                {/if}
            {/snippet}
        </Canvas>
    </div>
</div>

