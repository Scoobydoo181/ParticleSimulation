import "https://cdn.plot.ly/plotly-2.11.1.min.js"

export function handleSlider(state) {
    let slider = document.getElementById("myRange");
    let particleCount = document.getElementById("particleCount")
    // Update the current slider value (each time you drag the slider handle)
    slider.oninput = function () {
        state.numParticles = this.value;
        particleCount.innerText = ('000' + this.value).slice(-3) 
    }
}

export function handleButton(state) {
    let button = document.getElementById('toggleDistribution')
    let graph = document.getElementById('graph')
    button.onclick = function() {
        state.distributionVisible = !state.distributionVisible

        if(state.distributionVisible) {
            graph.style.display = 'block'
            
        } else 
            graph.style.display = 'none'
    }
}

export function drawDistribution(state, objects) {
    if(!state.distributionVisible)
        return;

    const data = objects.slice(0, state.numParticles).map(x => x.velocity.length())

    Plotly.react('graph', [{
        x: data,
        type: 'histogram',
    }], {
        bargap: 0.05,
        bargroupgap: 0.2,
        barmode: "overlay",
        title: "Velocity Distribution",
        xaxis: { title: "Velocity (m/s)", range: [0, 5] },
        yaxis: { title: "Number of Particles", range: [0, 91] }, 
    }, {
        displayModeBar: false,
        staticPlot: true,
    });    
}