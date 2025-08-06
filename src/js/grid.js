const Orthogonal = 4;
const Octilinear = 8;
export default class Grid {
    size;
    static On = 1;
    static Off = 0;
    grid;
    swap;
    constructor(size) {
        this.size = size;
        this.size = size;
        this.grid = new Uint8Array(size * size);
        this.swap = new Uint8Array(size * size);
    }
    set(x, y, state) {
        const size = this.size;
        if (x < 0 || y < 0 || x >= size || y >= size)
            return false;
        const index = this.index(x, y, size);
        if (this.grid[index] === state)
            return false;
        this.grid[index] = state;
        return true;
    }
    index(x, y, size) {
        return size * y + x;
    }
    resize(newSize) {
        if (this.size === newSize)
            return;
        const newGrid = new Uint8Array(newSize * newSize);
        const loopSize = Math.min(this.size, newSize);
        for (let i = 0; i < loopSize; i++) {
            for (let j = 0; j < loopSize; j++) {
                const oldIndex = this.index(i, j, this.size);
                const newIndex = this.index(i, j, newSize);
                newGrid[newIndex] = this.grid[oldIndex];
            }
        }
        this.size = newSize;
        this.grid = newGrid;
        this.swap = new Uint8Array(this.size * this.size);
    }
    randomize(fractionOn) {
        for (let i = 0; i < this.grid.length; i++) {
            this.grid[i] = Math.random() <= fractionOn ? 1 : 0;
        }
    }
    clear(state) {
        for (let i = 0; i < this.grid.length; i++) {
            this.grid[i] = state;
        }
    }
    updateOrthogonal(onRules, offRules) {
        // get neighbor counts
        console.log(onRules.toString(2), offRules.toString(2));
        const size = this.size;
        for (let x = 0; x < size; x++) {
            const east = x == size - 1 ? 0 : x + 1;
            const west = x == 0 ? size - 1 : x - 1;
            for (let y = 0; y < size; y++) {
                const south = y == size - 1 ? 0 : y + 1;
                const north = y == 0 ? size - 1 : y - 1;
                let count = 0;
                count += this.grid[this.index(east, y, size)];
                count += this.grid[this.index(x, south, size)];
                count += this.grid[this.index(west, y, size)];
                count += this.grid[this.index(x, north, size)];
                const index = this.index(x, y, size);
                switch (this.grid[index]) {
                    case Grid.On:
                        this.swap[index] = ((onRules & (1 << count)) >> count) ^ 1;
                        break;
                    case Grid.Off:
                        this.swap[index] = (offRules & (1 << count)) >> count;
                        break;
                }
            }
        }
        [this.grid, this.swap] = [this.swap, this.grid];
    }
    updateOctilinear(onRules, offRules) {
        const size = this.size;
        for (let x = 0; x < size; x++) {
            const east = x == size - 1 ? 0 : x + 1;
            const west = x == 0 ? size - 1 : x - 1;
            for (let y = 0; y < size; y++) {
                const south = y == size - 1 ? 0 : y + 1;
                const north = y == 0 ? size - 1 : y - 1;
                let count = 0;
                count += this.grid[this.index(east, y, size)];
                count += this.grid[this.index(x, south, size)];
                count += this.grid[this.index(west, y, size)];
                count += this.grid[this.index(x, north, size)];
                count += this.grid[this.index(east, south, size)];
                count += this.grid[this.index(west, south, size)];
                count += this.grid[this.index(west, north, size)];
                count += this.grid[this.index(east, north, size)];
                const index = this.index(x, y, size);
                switch (this.grid[index]) {
                    case Grid.On:
                        this.swap[index] = ((onRules & (1 << count)) >> count) ^ 1;
                        break;
                    case Grid.Off:
                        this.swap[index] = (offRules & (1 << count)) >> count;
                        break;
                }
            }
        }
        [this.grid, this.swap] = [this.swap, this.grid];
    }
}
