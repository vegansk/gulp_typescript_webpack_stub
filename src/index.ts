import { sprintf } from 'sprintf-js'
import './style/style.css'

if (process.env.NODE_ENV === "development") {
  console.log("Starting debug version...")
} else {
  console.log("Starting release version...")
}

console.log(sprintf("Hello, %s", "world!"))
