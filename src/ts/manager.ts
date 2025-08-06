import Rect from './rect.js'
import Grid from './grid.js'
import Point from './point.js'

export default class Manager {

    private sizeRange = document.getElementById('size-range') as HTMLInputElement
    private randomizationRange = document.getElementById('randomization-range') as HTMLInputElement
    private iterationsRange = document.getElementById('iterations-range') as HTMLInputElement
    private speedRange = document.getElementById('speed-range') as HTMLInputElement
    private checkboxes = document.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>
    private onCheckboxes = document.getElementsByClassName('on-checkbox') as HTMLCollectionOf<HTMLInputElement>
    private offCheckboxes = document.getElementsByClassName('off-checkbox') as HTMLCollectionOf<HTMLInputElement>
    private canvas = document.getElementById('grid-canvas') as HTMLCanvasElement
    private playButton = document.getElementById('play-button') as HTMLButtonElement
    private gridCanvas = document.createElement('canvas') as HTMLCanvasElement

    private grid: Grid
    private leftDown = false
    private rightDown = false
    private intervalId = 0

    constructor() {
        this.grid = new Grid(this.size())
        
        document.getElementById('clear-on-button')!.addEventListener('click', () => { this.clear(Grid.On) })
        document.getElementById('clear-off-button')!.addEventListener('click', () => { this.clear(Grid.Off) })
        this.sizeRange.addEventListener('change', () => { this.sizeChanged() })
        document.getElementById('randomize-cells-button')!.addEventListener('click', () => { this.randomizeCells() })
        document.getElementById('randomize-rules-button')!.addEventListener('click', () => { this.randomizeRules() })
        document.getElementById('step-button')!.addEventListener('click', () => { this.step() })
        this.playButton.addEventListener('click', () => { this.togglePlay() })
        this.speedRange.addEventListener('change', () => { this.speedChanged() })

        this.canvas.addEventListener('mousedown', e => { this.mouseDown(e) })
        this.canvas.addEventListener('mousemove', e => { this.mouseMove(e) })
        this.canvas.addEventListener('mouseup', e => { this.mouseUp(e) })
        this.canvas.addEventListener('contextmenu', e => { e.preventDefault() })

        window.addEventListener('resize', () => { this.resizeCanvas() })


        this.resizeCanvas()
        this.resetGridCanvas(this.size())
        this.render()
    }




    onRules() {
        return this.rules(this.onCheckboxes)
    }
    offRules() {
        return this.rules(this.offCheckboxes)
    }
    rules(checkboxes: HTMLCollectionOf<HTMLInputElement>) {
        let rules = 0
        for (const checkbox of checkboxes) {
            if (!checkbox.checked) continue

            rules |= 1 << Number.parseInt(checkbox.value)
        }
        return rules
    }



    resetGridCanvas(size: number) {
        this.gridCanvas.width = size
        this.gridCanvas.height = size
    }
    sizeChanged() {
        const size = this.size()
        this.grid.resize(size)
        this.resetGridCanvas(size)
        this.render()
    }
    size() {
        return Number.parseInt(this.sizeRange.value)
    }




    randomizationFraction() {
        return Number.parseFloat(this.randomizationRange.value)
    }
    iterations() {
        return Number.parseInt(this.iterationsRange.value)
    }
    frameDurationMilliseconds() {
        return Math.floor(1000 / Number.parseInt(this.speedRange.value))
    }


    randomizeRules() {
        for (const checkbox of this.checkboxes) {
            checkbox.checked = Math.random() > 0.5
        }
    }
    randomizeCells() {
        this.grid.randomize(this.randomizationFraction())
        this.render()
    }
    clear(state: number) {
        this.grid.clear(state)
        this.render()
    }



    updateType() {
        return (document.querySelector('input[name="update-type"]:checked') as HTMLInputElement).value
    }
    step() {
        const onRules = this.onRules()
        const offRules = this.offRules()
        switch (this.updateType()) {
            case "orthogonal":
                for (let i = 0; i < this.iterations(); i++) {
                    this.grid.updateOrthogonal(onRules, offRules)
                }
            break
            case "octilinear":
                for (let i = 0; i < this.iterations(); i++) {
                    this.grid.updateOctilinear(onRules, offRules)
                }
            break
        }
        this.render()
    }
    togglePlay() {
        
        switch (this.playButton.textContent) {
            case 'Play':
                this.step()
                this.intervalId = window.setInterval(() => {
                    this.step()
                }, this.frameDurationMilliseconds())
                this.playButton.textContent = 'Stop'
            break
            case 'Stop':
                window.clearInterval(this.intervalId)
                this.playButton.textContent = 'Play'
            break
        }
    }

    speedChanged() {
        if (this.playButton.textContent == 'Stop') {
            window.clearInterval(this.intervalId)
            this.intervalId = window.setInterval(() => {
                this.step()
            }, this.frameDurationMilliseconds())
        }
    }
















    mouseDown(e: MouseEvent) {
        if (e.button === 0) {
            this.leftDown = true
        } else if (e.button === 2) {
            this.rightDown = true
        }
        this.mouse(e)
    }
    mouseMove(e: MouseEvent) {
        this.mouse(e)
    }
    mouseUp(e: MouseEvent) {
        if (e.button === 0) {
            this.leftDown = false
        } else if (e.button === 2) {
            this.rightDown = false
        }
    }

    mouse(e: MouseEvent) {
        const gridPoint = this.gridPoint(e.offsetX, e.offsetY)
        if (this.leftDown === this.rightDown) return

        let set = false
        if (this.leftDown) {
            set = this.grid.set(gridPoint.x, gridPoint.y, Grid.On)
        } else if (this.rightDown) {
            set = this.grid.set(gridPoint.x, gridPoint.y, Grid.Off)
        }
        if (set) {
            this.render()
        }
    }




    gridPoint(mouseX: number, mouseY: number) {
        const length = this.constrainingDimensionLength()
        const cellSize = this.cellSize(length)
        const rect = this.renderRect(length)
        const x = Math.floor((mouseX - rect.x) / cellSize)
        const y = Math.floor((mouseY - rect.y) / cellSize)
        return new Point(x, y)
    }
    resizeCanvas() {
        const canvasBounds = this.canvas.getBoundingClientRect()
        this.canvas.width = canvasBounds.width
        this.canvas.height = canvasBounds.height
        this.render()
    }
    horizontalViewport() {
        return this.canvas.width > this.canvas.height
    }
    constrainingDimensionLength() {
        return this.horizontalViewport() ? this.canvas.height : this.canvas.width
    }
    cellSize(length: number) {
        return length / this.grid.size
    }
    renderRect(length: number) {
        const x = (this.canvas.width - length) / 2
        const y = (this.canvas.height - length) / 2
        return new Rect(x, y, length, length)
    }

    render() {
        const length = this.constrainingDimensionLength()
        const cellSize = this.cellSize(length)
        const rect = this.renderRect(length)
        const ctx = this.canvas.getContext('2d')!

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        this.renderGrid(rect, ctx)
        this.renderGridLines(rect, cellSize, ctx)
    }

    renderGridLines(rect: Rect, cellSize: number, ctx: CanvasRenderingContext2D) {
        const left = rect.x
        const right = left + rect.w
        const top = rect.y
        const bottom = top + rect.h

        ctx.strokeStyle = '#8888'
        ctx.beginPath()
        for (let i = 0; i <= this.grid.size; i++) {
            const offset = cellSize * i
            const x = left + offset
            const y = top + offset
            ctx.moveTo(x, top)
            ctx.lineTo(x, bottom)
            ctx.moveTo(left, y)
            ctx.lineTo(right, y)
        }
        ctx.stroke()
    }

    renderGrid(rect: Rect, ctx: CanvasRenderingContext2D) {
        ctx.imageSmoothingEnabled = false
        const size = this.grid.size
        const gridCtx = this.gridCanvas.getContext('2d')!
        gridCtx.clearRect(0, 0, size, size)
        const imageData = gridCtx.createImageData(size, size)
        const buffer = new Uint32Array(imageData.data.buffer)
        const grid = this.grid.grid
        for (let i = 0; i < grid.length; i++) {
            buffer[i] = grid[i] * 0xffffffff
        }
        gridCtx.putImageData(imageData, 0, 0)
        ctx.drawImage(this.gridCanvas, rect.x, rect.y, rect.w, rect.h)
    }
}