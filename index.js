import { handleButton, handleSlider } from './ui.js'
import { runAnimation } from './animation.js'

let state = {
    numParticles: 1, 
    distributionVisible: false
}

handleButton(state)

handleSlider(state)

runAnimation(state)