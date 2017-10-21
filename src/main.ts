import * as config from "config"
import {Sound} from "./Sound"
import * as async from "async"
const simplayer = require("simplayer")
const soundList = config.get<Array<Sound>>("sounds")
const interval = config.get<number>("interval")
const i2c = require("i2c")
const address = 0x68
const accelerationX = 0x3b
const accelerationY = 0x3d
const accelerationZ = 0x3f
const power = 0x6b

const sensor = new i2c(address, {device: "/dev/i2c-1"})

let count = 0
let enableSound = false
let oldX = 0
let oldY = 0
let oldZ = 0

soundList.sort((a, b) => {
  if (a.threshold < b.threshold) {
    return -1
  } else if (a.threshold > b.threshold) {
    return 1
  } else {
    return 0
  }
})

// sleep解除
sensor.writeBytes(power, [0x00], (error) => {})

// simplayer(soundList[2].path)
async.forever((callback) => {
  setTimeout(() => {
    count++
    let x, y, z: number
    readByteWithNumber(accelerationX).then((value) => {
      x = value
      return readByteWithNumber(accelerationY)
    }).then((value) => {
      y = value
      return readByteWithNumber(accelerationZ)
    }).then((value) => {
      z = value
      console.log("x: " + x + ", y: " + y + ", z: " + z)
      if (enableSound) {
        const all = Math.abs(x - oldX) + Math.abs(y - oldY) + Math.abs(z - oldZ)
        if (all >= soundList[0].threshold) {
          soundList.forEach((sound, index) => {
            if (index === soundList.length - 1) {
              if (sound.threshold <= all) {
                simplayer(sound.path)
                count = 0
                enableSound = false
              }
            } else {
              if (sound.threshold <= all && soundList[index + 1].threshold > all) {
                simplayer(sound.path)
                count = 0
                enableSound = false
              }
            }
          })
        }
      } else if(count >= interval) {
        enableSound = true
      }
      oldX = x
      oldY = y
      oldZ = z
    }).catch((error) => {
      console.log(error)
      // sleep解除
      sensor.writeBytes(power, [0x00], (error) => {})
    })
    callback()
  }, 1000)
}, (error) => {
  console.log(error)
})

function readByteWithNumber(address: number): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    sensor.readBytes(address, 2, (err, data) => {
      if (err != null) {
        return reject(err)
      }
      let value = (data[0] << 8) + data[1]
      if (value > 0x8000 ) {
        resolve(-((65535 - value) + 1))
      } else {
        resolve(value)
      }
    })
  })
}
