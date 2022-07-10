(function() {
    function init_canvas(width, height) {
        const canvas = document.getElementById("game-canvas")

        if (typeof canvas === 'undefined') {
            throw new Error(`canvas is undefined...`)
        }

        canvas.setSize = function(width, height) {
            this.width = width
            this.height = height

            this.style.width = `${this.width}px`
            this.style.height = `${this.height}px`
        }

        canvas.setSize(width, height)

        canvas.context = canvas.getContext("2d")
        canvas.context.container = function(callback) {
            this.save()
            callback()
            this.restore()
        }

        return canvas
    }
    
    const canvas = init_canvas(400, 400)
    const context = canvas.context

    const webkitReqAnimFrame = window.webkitRequestAnimationFrame
    const mozReqAnimFrame = window.mozRequestAnimationFrame
    let reqAnimFrame = window.requestAnimationFrame

    function reqAnimFrame_callback(callback, frames) {
        frames = frames ?? 1e3 / 60

        return (setTimeout(callback, frames))
    }

    reqAnimFrame = reqAnimFrame ?? webkitReqAnimFrame ?? mozReqAnimFrame ?? reqAnimFrame_callback

    class Generator {
        constructor(x, y, image, width, height, context) {
            this.ctx = context

            this.x = x
            this.y = y
            this.image = image
            this.width = width
            this.height = height

            this.lastFalling = Date.now()
            this.fallingCooldown = Utils.randInt(1500, 5000)
            this.fallingOldY = this.y
            this.fallingOffsetY = 4
            this.fallingResetTime = 250
            
            this.possibleSkins = 2
        }

        draw() {
            this.ctx.container(() => {
                this.ctx.drawImage(this.image, this.x, this.y, this.width, this.height)
            })
        }

        _animBlowout(garbageStorage) {
            this.fallingOldY = this.y

            for (let int = 2; int <= this.fallingOffsetY; int++) {
                this.y -= int
            }

            setTimeout(() => {
                const type = Utils.randInt(1, this.possibleSkins)
                const image = Utils.getImage(`garbage/garbage_${type}`)
                const x = this.x + (this.width / 2)
                const y = this.height + 10

                garbageStorage.add(x, y, image, 50, 50)
            }, this.fallingResetTime / 2)

            setTimeout(() => {
                this.y = this.fallingOldY

                this.fallingCooldown = Utils.randInt(1500, 5000)
            }, this.fallingResetTime)
        }

        update(garbageStorage) {
            this.draw()

            if (!this.lastFalling || Date.now() - this.lastFalling >= this.fallingCooldown) {
                this._animBlowout(garbageStorage)

                this.lastFalling = Date.now()
            }
        }
    }

    class Generators {
        constructor(context) {
            this.ctx = context
            this.cvs = this.ctx.canvas

            this.allGenerators = []
            this.limit = 3

            this.width = 75
            this.height = 95
        }

        add(int) {
            const image = Utils.getImage("generators/generator")
            const x = ((this.cvs.width / 2 - this.width / 2) / 2) * int
            const y = 0
            
            this.allGenerators.push(new Generator(x, y, image, this.width, this.height, this.ctx))
        }

        add_generators() {
            if (this.allGenerators.length >= this.limit) {
                return void 0
            }

            for (let int = 1; int <= this.limit; int++) {
                this.add(int)
            }
        }

        update(garbageStorage) {
            this.add_generators()

            for (const generator of this.allGenerators) {
                generator.update(garbageStorage)
            }
        }
    }

    class Garbage {
        constructor(x, y, image, width, height, gid, context) {
            this.ctx = context
            this.cvs = this.ctx.canvas

            this.x = x
            this.y = y
            this.image = image
            this.width = width
            this.height = height
            this.gid = gid
            this.speed = 1

            this.rotate = Utils.randInt(0, 360)
            this.rotateSide = Utils.randInt(0, 1)

            this.lastRotate = Date.now()
        }

        draw() {
            this.ctx.container(() => {
                if (this.rotate >= 360) {
                    this.rotate = 0
                }

                this.rotate = this.rotateSide ? this.rotate - 1 : this.rotate + 1

                this.ctx.translate(this.x, this.y)
                this.ctx.rotate(this.rotate * Math.PI / 180)
                this.ctx.drawImage(this.image, -(this.width / 2), -(this.height / 2), this.width, this.height)
            })
        }

        goDown() {
            this.y = this.y + this.speed
        }

        update() {
            this.draw()
            this.goDown()
        }
    }

    class GarbageStorage {
        constructor(context, trashcan) {
            this.ctx = context
            this.cvs = this.ctx.canvas

            this.allGarbage = []
            this.limit = 100

            this.trashcan = trashcan
        }

        add(x, y, image, width, height) {
            if (Utils.getLength(this.allGarbage) === this.limit) {
                return void 0
            }

            const gid = Utils.randInt(10000, 100000)

            this.allGarbage[gid] = new Garbage(x, y, image, width, height, gid, this.ctx)
        }

        clear() {
            this.allGarbage = []
        }

        isLeft(garbage, callback) {
            const maxY = this.cvs.height + garbage.height + 3 // 3 = border size

            if (garbage.y >= maxY) {
                if (this.trashcan.collected > 0) {
                    this.trashcan.collected--
                }

                return delete this.allGarbage[garbage.gid]
            }

            callback()
        }

        update() {
            for (const gid in this.allGarbage) {
                this.isLeft(this.allGarbage[gid], () => {
                    this.allGarbage[gid].update()
                })
            }
        }
    }

    class Field {
        constructor(width, height, context) {
            this.width = width
            this.height = height
            this.ctx = context

            this.x = 0
            this.y = 0
            this.bgImage = null
            this.borderImage
        }

        drawBorder() {
            this.ctx.container(() => {
                this.borderImage = Utils.getImage("field/border")

                this.ctx.drawImage(this.borderImage, this.x, this.y, this.width, this.height)
            })
        }

        _drawBackground() {
            this.ctx.container(() => {
                this.bgImage = Utils.getImage("field/game-bg")

                this.ctx.drawImage(this.bgImage, this.x, this.y, this.width, this.height)
            })
        }

        clear() {
            this.ctx.clearRect(this.x, this.y, this.width, this.height)
        }

        update() {
            this.clear()
            this._drawBackground()
        }
    }

    class Trashcan {
        constructor(context) {
            this.ctx = context
            this.cvs = this.ctx.canvas

            this.image = Utils.getImage("trashcan/body")
            this.width = 58
            this.height = 85

            this.x = 0
            this.y = this.cvs.height - this.height - this.height / 3
            this.collectedY = 10
            this.collectedX = 65
            this.badY = 250
            this.badX = 0

            this.collected = 0

            this.speed = 1
        }

        setX(x) {
            this.x = x
        }

        draw() {
            this.ctx.container(() => {
                this.ctx.drawImage(this.image, this.x, this.y, this.width, this.height)
            })
        }

        isThrow(allGarbage) {
            for(const gid in allGarbage) {
                const garbage = allGarbage[gid]
                const distX = Utils.distY(this.x, garbage.x)
                const distY = Utils.distY(this.y, garbage.y)
                
                if (distY <= this.collectedY && garbage.y - garbage.height <= this.badY) {
                    if (distX >= 0 && distX <= this.collectedX && garbage.x - this.x >= this.badX) {
                        this.collected += 1
                        delete allGarbage[gid]
                    }
                }
            }
        }

        update(garbageStorage) {
            this.isThrow(garbageStorage.allGarbage)
            this.draw()
        }
    }

    const trashcan = new Trashcan(context)
    
    Utils.mousemove("#game-canvas", (event) => {
        const mouseX = event.offsetX
        const mouseY = event.offsetY
        const x = mouseX - (trashcan.width / 2)

        trashcan.setX(x, mouseX)
    })

    class Counter {
        constructor(context) {
            this.ctx = context
            this.x = 10
            this.y = 23
        }
        draw(text) {
            this.ctx.container(() => {
                this.ctx.font = "bold 18px Play, sans-serif"
                this.ctx.fillStyle = "#d0d0d0"
                this.ctx.fillText(text, this.x, this.y)
            })
        }
    }

    class Renderer {
        constructor(context) {
            this.ctx = context
            this.cvs = this.ctx.canvas

            this.active = true

            this.field = new Field(this.cvs.width, this.cvs.height, this.ctx)
            this.generators = new Generators(this.ctx)
            this.garbageStorage = new GarbageStorage(this.ctx, trashcan)
            this.trashcan = trashcan
            this.counter = new Counter(this.ctx)
        }

        stop() {
            this.active = false
        }

        start() {
            this.active = true
        }

        update() {
            if (!this.active) {
                return void 0
            }

            this.field.update()
            this.garbageStorage.update()
            this.trashcan.update(this.garbageStorage)
            this.generators.update(this.garbageStorage)
            this.field.drawBorder()

            this.counter.draw(this.trashcan.collected)
        }
    }

    const renderer = new Renderer(context)

    window.onblur = function() {
        renderer.stop()
    }

    window.onfocus = function() {
        renderer.start()
    }

    function updateGame() {
        if (typeof context === 'undefined') {
            return void 0
        }

        renderer.update()

        return reqAnimFrame(updateGame)
    }

    updateGame()
})()

