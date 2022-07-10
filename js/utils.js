
const Utils = {}

Utils.getImage = function(name, callback = new Function(), type = "png") {
    const image = new Image()

    image.onload = function() {
        callback(this)
    }

    image.onerror = function() {
        console.error(`images/${name}.${type} is undefined`)
    }

    image.src = `images/${name}.${type}`

    return image
}

Utils.randInt = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

Utils.getLength = function(value) {
    return Object.values(value).length
}

Utils.sleep = function() {
    return new Promise((resolve) => {
        setTimeout(resolve, 1000)
    })
}

Utils.mousemove = function(element, callback) {
    document.querySelector(element).addEventListener("mousemove", (event) => {
        callback(event)
    })
}

Utils.distX = function(x1, x2) {
    return Math.hypot(x1 - x2)
}

Utils.distY = function(y1, y2) {
    return Math.hypot(y1 - y2)
}

Utils.dist = function(x1, y1, x2, y2) {
    return Math.hypot(y1 - y2, x1 - x2)
}